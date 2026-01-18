import { useState } from "react";

interface MatchSuccessData {
  myTeamImageUrl: string;
  otherTeamImageUrl: string;
  chatRoomId: string;
}

export function useMatchSuccess() {
  const [isOpen, setIsOpen] = useState(false);
  const [matchData, setMatchData] = useState<MatchSuccessData | null>(null);

  const showMatchSuccess = (data: MatchSuccessData) => {
    setMatchData(data);
    setIsOpen(true);
  };

  const closeMatchSuccess = () => {
    setIsOpen(false);
    setMatchData(null);
  };

  return {
    isOpen,
    matchData,
    showMatchSuccess,
    closeMatchSuccess,
  };
}
