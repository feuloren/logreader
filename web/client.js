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

        // on sauvegarde l'id et on ajoute le div au div principal
        followedFiles[data.file] = id;
        $('#logs').append(log);

        // on crée un bouton pour afficher ce fichier
        var button = document.createElement('a');
        button.href = "#" ;
        button.title = data.file;
        // texte du bouton = nom du fichier
        button.innerHTML = data.file.split('/').pop();
        $(button).click(function() {
            if (id == activeFile)
                return;
            $(activeFile).hide();
            $(id).show();
            $(id + '-button').addClass("pure-menu-selected");
            $(activeFile + '-button').removeClass("pure-menu-selected");
            activeFile = id;
        });

        li = document.createElement('li');
        li.id = log.id + '-button';

        // On cache ce div si on suit déjà d'autres fichiers
        if(activeFile !== undefined) {
            $(log).hide();
        } else {
            activeFile = id;
            li.classList.add("pure-menu-selected");
        }

        li.appendChild(button);
        $('#tabs').append(li);

        saveFiles();

        // on récupère quelques lignes de la fin du fichier
        // comme tail -f
        socket.emit('prevlines', {file: data.file});

        $('#dialog').hide();
        $('#li-add-file').removeClass("pure-menu-selected");
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
    $('#dialog').show();
    $('#li-add-file').addClass("pure-menu-selected");
});

$('#form-follow').submit(function() {
    var file = $('#input-add-file').val();
    if (followedFiles[file] === undefined)
        socket.emit('follow', {file: file});
});

$('#btn-cancel-add-file').click(function(e) {
    $('#dialog').hide();
    $('#li-add-file').removeClass("pure-menu-selected");
});

// fonctions de sauvegarde
function saveFiles() {
    var files = Object.keys(followedFiles);
    localStorage.setItem("files", JSON.stringify(files));
}

function populateFiles() {
    var filesJson = localStorage.getItem("files");
    if (filesJson == null)
        return;
    var files = JSON.parse(filesJson);

    for(var i = 0; i < files.length; i++) {
        socket.emit('follow', {file: files[i]});
    }
}

$(document).ready(function() {
    populateFiles();
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