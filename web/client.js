var socket = io.connect('http://localhost');

var followedFiles = {};
var activeFile = undefined;

// l'évènement line est émis quand une ligne est ajoutée à un fichier
socket.on('line', function (data) {
    if (followedFiles[data.file] !== undefined) {
        var line = document.createElement("div");
        // ajouter un système de formatter ici
        line.innerHTML = data.data;
        $(followedFiles[data.file]).append(line);
    }
});

// followed est émis quand on suit un nouveau fichier
socket.on('followed', function (data) {
    if (followedFiles[data.file] === undefined) {
        // on crée un div qui va contenir les lignes de log
        var log = document.createElement("div");
        log.id = "a" + guid(); // avec un id aléatoire
        var id = '#' + log.id;

        // On cache ce div si on suit déjà d'autres fichiers
        if (activeFile !== undefined) {
            log.style.diplay = "none";
        } else {
            activeFile = id;
        }

        // on sauvegarde l'id et on ajoute le div au div principal
        followedFiles[data.file] = id;
        $('#logs').append(log);

        // on crée un bouton pour afficher ce fichier
        var button = document.createElement('button');
        // texte du bouton = nom du fichier
        button.innerHTML = data.file.split('/').pop();
        $(button).click(function() {
            $(activeFile).hide();
            $(id).show();
            activeFile = id;
        });

        $('#tabs').append(button);
    }
});

// cant follow est emis si on ne peut pas suivre un fichier
socket.on('cant follow', function(data) {
    if (data.reason == 'ENOENT') {
        reason = "File doesn't exist";
    }
    else if (data.reason == 'EACCES') {
        reason = "Not allowed to read file";
    }
    else {
        reason = "Unknown reason : " + data.reason;
    }
    alert("Can't follow " + data.file + " : " + reason);
});

$('#btn-add-file').click(function() {
    socket.emit('follow', {file: $('#input-add-file').val()});
});

// fonction de génération d'uuid
function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
             .toString(16)
             .substring(1);
};

function guid() {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
         s4() + '-' + s4() + s4() + s4();
}