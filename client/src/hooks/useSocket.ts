import { useEffect } from "react";

import { socket } from "../services/socket";

export function useSocket() {
  useEffect(() => {
    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, []);

  return socket;
}
