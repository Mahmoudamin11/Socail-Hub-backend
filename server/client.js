import io from 'socket.io-client';
import jwt_decode from 'jwt-decode';

const socket = io('http://localhost:8800');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const callButton = document.getElementById('callButton');

let localStream;
let peerConnection;
const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

// Decode the token to get user ID
const token = localStorage.getItem('token');
const decodedToken = jwt_decode(token);
const userId = decodedToken.id;

async function startLocalStream() {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localVideo.srcObject = localStream;
}

async function callUser(targetUserId) {
  peerConnection = new RTCPeerConnection(configuration);

  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(new RTCSessionDescription(offer));

  // Send call request to the server
  const response = await fetch('http://localhost:8800/api/calls/initiate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ to: targetUserId, offer: peerConnection.localDescription })
  });

  if (!response.ok) {
    const errorResponse = await response.json();
    console.error('Failed to initiate call:', errorResponse.message);
    alert(`Call failed: ${errorResponse.message}`);
    return;
  }

  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit('ice-candidate', { from: userId, to: targetUserId, candidate: event.candidate });
    }
  };

  peerConnection.ontrack = event => {
    remoteVideo.srcObject = event.streams[0];
  };
}

socket.on('call-made', async ({ from, offer }) => {
  peerConnection = new RTCPeerConnection(configuration);

  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(new RTCSessionDescription(answer));

  socket.emit('make-answer', { from: userId, to: from, answer });

  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit('ice-candidate', { from: userId, to: from, candidate: event.candidate });
    }
  };

  peerConnection.ontrack = event => {
    remoteVideo.srcObject = event.streams[0];
  };
});

socket.on('answer-made', async ({ from, answer }) => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on('ice-candidate', ({ candidate }) => {
  peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

callButton.addEventListener('click', () => {
  const targetUserId = prompt("Enter the ID of the user you want to call:");
  callUser(targetUserId);
});

startLocalStream();
