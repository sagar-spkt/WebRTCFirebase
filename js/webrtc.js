// Initialize Firebase
var config = {
    apiKey: "AIzaSyDqLxmzedBglXlxrqLCnnKIGwKU4mdqbQA",
    authDomain: "webrtc-learn.firebaseapp.com",
    databaseURL: "https://webrtc-learn.firebaseio.com",
    projectId: "webrtc-learn",
    storageBucket: "webrtc-learn.appspot.com",
    messagingSenderId: "731159768520"
};
firebase.initializeApp(config);

var database = firebase.database().ref();
var yourVideo = document.getElementById("yourVideo");
var friendsVideo = document.getElementById("friendsVideo");
var callIdField = document.getElementById("callerId");
let yourId;
let callId;

function login(form) {
    if(form.username.value === "" || form.username.value === undefined){
        alert("Enter valid username");
        return false;
    }
	yourId = form.username.value;
    form.username.value = yourId + "(logged in)";
    form.username.disabled = true;
    form.login_submit.disabled = true;
    return false; //
}

var servers = {'iceServers': [
        {'urls': 'stun:stun.services.mozilla.com'},
        {'urls': 'stun:stun.l.google.com:19302'},
        {'urls': 'turn:numb.viagenie.ca',  'credential': 'sagar12345', 'username': 'spkt.sagar@gmail.com'}
    ]};

function sendMessage(senderId, receiverId, data) {
    var msg = database.push({
        sender: senderId,
        receiver: receiverId,
        message: data
    });
    msg.remove();
}

function showMyFace() {
    navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
    }).then(stream => yourVideo.srcObject = stream)
        .then(stream => pc.addStream(stream));
}

var pc = new RTCPeerConnection(servers);
pc.onicecandidate = (event => event.candidate ?
    sendMessage(yourId, callId, JSON.stringify({
        'ice': event.candidate
    })): console.log("Sent All Ice"));
pc.onaddstream = (event => friendsVideo.srcObject = event.stream);

function showFriendsFace() {
    callId = callIdField.value;
    pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .then(() => sendMessage(yourId, callId, JSON.stringify({
            'sdp': pc.localDescription
        })));
    return false;
}

function readMessage(data) {
    var msg = JSON.parse(data.val().message);
    var sender = data.val().sender;
    var receiver = data.val().receiver;
    if (receiver === yourId) {
        if (msg.ice !== undefined)
            pc.addIceCandidate(new RTCIceCandidate(msg.ice));
        else if (msg.sdp.type === "offer")
            pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))
                .then(() => pc.createAnswer())
                .then(answer => pc.setLocalDescription(answer))
                .then(() => sendMessage(yourId, sender, JSON.stringify({
                    'sdp': pc.localDescription
                })));
        else if (msg.sdp.type === "answer")
            pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
    }
}
database.on('child_added', readMessage);
