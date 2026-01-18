// 音声通話関連の型定義

export interface VoiceCallConfig {
  roomId: string;
  externalUserId: string;
  enableEchoCancellation?: boolean;
  enableNoiseSuppression?: boolean;
  enableAutomaticGainControl?: boolean;
}

export interface Attendee {
  attendeeId: string;
  externalUserId: string;
  name?: string;
  isSpeaking?: boolean;
  isMuted?: boolean;
  volume?: number;
  signalStrength?: number;
}

export interface MeetingInfo {
  meetingId: string;
  externalMeetingId: string;
  mediaRegion: string;
  attendees: Attendee[];
}

export interface VoiceCallState {
  isInCall: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  isMuted: boolean;
  isSpeakerOn: boolean;
  error: string | null;
  attendees: Attendee[];
  meetingId: string | null;
  attendeeId: string | null;
}

export interface VoiceCallControls {
  toggleMute: () => void;
  toggleSpeaker: () => void;
  leaveMeeting: () => void;
  reconnect: () => void;
}

export interface VoiceCallProps {
  roomId: string;
  externalUserId: string;
  onCallEnd?: () => void;
  onError?: (error: string) => void;
  onStateChange?: (state: Partial<VoiceCallState>) => void;
}
