import { Component, OnInit } from '@angular/core';
import SimplePeer from 'simple-peer';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-video-call',
  templateUrl: './video-call.component.html',
  styleUrls: ['./video-call.component.scss']
})
export class VideoCallComponent implements OnInit {
  private socket: WebSocket | undefined;
  private peers: Map<string, SimplePeer.Instance> = new Map();
  private localStream: MediaStream | undefined;
  private signalBuffer: Map<string, string[]> = new Map();
  private isHost: boolean = false;

  roomId: string = '';
  username: string = '';
  errorMessage: string = '';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private maxMessageSize = 1000;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.initializeVideo();
    this.authService.getCurrentUser().then((user) => {
      if (user) {
        this.username = user.username;
        console.log('User info:', this.username);
        this.connectToWebSocket();
      }
    });
  }

  async initializeVideo() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const localVideo = document.getElementById('localVideo') as HTMLVideoElement;
      if (localVideo && this.localStream) {
        localVideo.srcObject = this.localStream;
        console.log('Local video stream initialized');
      }
    } catch (error) {
      this.errorMessage = 'Error accessing media devices: ' + error;
      console.error('Error accessing media devices:', error);
    }
  }

  connectToWebSocket() {
    if (this.socket?.readyState === WebSocket.OPEN) return;

    this.socket = new WebSocket('ws://localhost:8000/video-call');

    this.socket.onopen = () => {
      console.log('Connected to WebSocket');
      this.reconnectAttempts = 0;
    };

    this.socket.onclose = (event) => {
      console.log('WebSocket connection closed. Reason:', event.reason);
      this.errorMessage = 'WebSocket connection closed. Reason: ' + event.reason;
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        this.connectToWebSocket();
      } else {
        console.error('Max reconnect attempts reached');
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.errorMessage = 'WebSocket error: ' + error;
    };

    this.socket.onmessage = (messageEvent) => {
      const data = JSON.parse(messageEvent.data);
      console.log('📩 Received message from server:', data);

      if (data.type === 'roomCreated') {
        this.roomId = data.roomId;
        this.isHost = true;
        console.log('🔧 Room created. I am host. My socketId:', data.peerId);
        this.joinRoom(this.roomId);
      } else if (data.type === 'joinedRoom') {
        console.log('👤 Joined room. My socketId:', data.peerId);
      } else if (data.type === 'peerJoined') {
        console.log('👥 Peer joined:', data.peerId);
        this.startCall(data.peerId);
      } else if (data.type === 'signal') {
        this.handleSignal(data);
      }
    };
  }

  createRoom() {
    if (!this.roomId) {
      this.errorMessage = 'Room ID is required to create a room!';
      return;
    }
    const createRoomMessage = { type: 'createRoom', roomName: this.roomId, username: this.username };
    console.log('📤 Sending createRoom:', createRoomMessage);
    this.socket?.send(JSON.stringify(createRoomMessage));
  }

  joinRoom(roomId: string) {
    if (!roomId) {
      this.errorMessage = 'Room ID is required to join a room!';
      return;
    }
    this.roomId = roomId;
    const joinRoomMessage = { type: 'joinRoom', roomId: this.roomId, username: this.username };
    console.log('📤 Sending joinRoom:', joinRoomMessage);
    this.socket?.send(JSON.stringify(joinRoomMessage));
  }

  startCall(peerId: string) {
    console.log("📞 Starting call with peer:", peerId);
    if (this.socket?.readyState === WebSocket.OPEN && !this.peers.has(peerId)) {
      const initiator = this.isHost;
      const peer = this.createPeer(peerId, initiator);
      if (peer) {
        this.peers.set(peerId, peer);
        console.log('✅ Created peer for:', peerId);
      }
    }
  }

  sendSignalInChunks(signalData: any, peerId: string) {
    const signalDataString = JSON.stringify(signalData);
    const chunks = this.chunkData(signalDataString, this.maxMessageSize);

    console.log(`📦 Sending signal in ${chunks.length} chunks to peer ${peerId}`);

    chunks.forEach((chunk, index) => {
      const signalMessage = {
        type: 'signal',
        signalData: chunk,
        peerId: peerId,
        chunkIndex: index,
        totalChunks: chunks.length
      };
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify(signalMessage));
        console.log('📤 Signal from initiator to', peerId);
      }
    });
  }

  chunkData(data: string, chunkSize: number) {
    const chunks: string[] = [];
    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.substring(i, i + chunkSize));
    }
    return chunks;
  }

  handleSignal(data: any) {
    console.log('📥 Received signaling data:', data);
    const peerId = data.peerId;
    const chunkIndex = data.chunkIndex;
    const totalChunks = data.totalChunks;
  
    const signalData = typeof data.signalData === 'string'
      ? data.signalData
      : JSON.stringify(data.signalData);
  
    // Lưu tín hiệu vào buffer nếu dữ liệu bị chia nhỏ
    if (chunkIndex !== undefined && totalChunks !== undefined) {
      const key = `${peerId}-signal`;
      if (!this.signalBuffer.has(key)) {
          this.signalBuffer.set(key, []);
      }
  
      const chunks = this.signalBuffer.get(key)!;
  
      while (chunks.length <= chunkIndex) {
          chunks.push('');
      }
  
      chunks[chunkIndex] = signalData;
  
      const receivedCount = chunks.filter(c => c !== '').length;
      if (receivedCount === totalChunks) {
          const fullSignalData = chunks.join('');
          this.signalBuffer.delete(key);
  
          try {
              const signal = JSON.parse(fullSignalData);
  
              let peer = this.peers.get(peerId);
              if (!peer) {
                  console.log('Creating peer on signal receive because peer does not exist yet:', peerId);
                  peer = this.createPeer(peerId, false);
                  if (peer) this.peers.set(peerId, peer);
              }
  
              if (peer && !peer.destroyed) {
                  // Kiểm tra trạng thái trước khi gọi `setRemoteDescription`
                  if (peer.connected) {
                      console.log('Peer connection is stable, skipping signal.');
                      return; // Không gọi signal khi peer đang ổn định
                  }
                  peer.signal(signal); // Chỉ gọi signal khi peer connection không ổn định
              } else {
                  console.warn('Peer is destroyed or not found for signal:', peerId);
              }
          } catch (err) {
              console.error('Failed to parse fullSignalData:', err);
          }
      }
    } else {
      const peer = this.peers.get(peerId);
      if (peer && !peer.destroyed) {
          // Kiểm tra trạng thái của peer trước khi gọi signal
          if (peer.connected) {
              console.log('Peer connection is stable, skipping signal.');
              return; // Đợi kết nối ổn định trước khi gửi tín hiệu
          }
          peer.signal(data.signalData);
      } else {
          console.warn('Peer not found or destroyed (no chunks) for:', peerId);
      }
    }
  }

  createPeer(peerId: string, initiator: boolean = false): SimplePeer.Instance | undefined {
    if (!this.localStream || this.socket?.readyState !== WebSocket.OPEN) return;
  
    console.log('🔧 Creating peer', peerId, '| initiator=' + initiator);
    const peer = new SimplePeer({ initiator: initiator, trickle: false, stream: this.localStream });
  
    peer.on('signal', (signalData) => {
      this.sendSignalInChunks(signalData, peerId); // Gửi tín hiệu (offer hoặc answer)
    });
  
    peer.on('stream', (remoteStream: MediaStream) => {
      console.log('🎥 Received remote stream from peer:', peerId);
      this.displayRemoteVideo(remoteStream, peerId);
    });
  
    peer.on('error', (error: any) => {
      console.error('Peer connection error:', error);
      this.errorMessage = 'Peer connection error: ' + error;
    });
  
    return peer;
  }

  displayRemoteVideo(remoteStream: MediaStream, peerId: string) {
    const remoteVideo = document.createElement('video');
    remoteVideo.srcObject = remoteStream;
    remoteVideo.autoplay = true;
    remoteVideo.playsInline = true;
    remoteVideo.id = peerId;

    const remoteVideosContainer = document.getElementById('remoteVideos');
    if (remoteVideosContainer) {
      remoteVideosContainer.appendChild(remoteVideo);
    } else {
      console.error('Cannot find #remoteVideos element to append video.');
    }

    remoteVideo.onloadedmetadata = () => {
      remoteVideo.play();
    };
  }
}
