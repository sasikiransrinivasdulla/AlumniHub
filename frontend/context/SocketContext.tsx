"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { Client } from "@stomp/stompjs";
import { getAuthToken, getUserProfile, UserProfile } from "@/services/authService";
import { getUnreadCount } from "@/services/chatService";
import { getUnreadNotificationsCount } from "@/services/notificationService";

interface SocketContextType {
  stompClient: Client | null;
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  unreadNotificationsCount: number;
  setUnreadNotificationsCount: React.Dispatch<React.SetStateAction<number>>;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  stompClient: null,
  unreadCount: 0,
  setUnreadCount: () => {},
  unreadNotificationsCount: 0,
  setUnreadNotificationsCount: () => {},
  connected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const profile = await getUserProfile();
        setUser(profile);
      } catch (err) {
        setUser(null);
      }
    }
    loadUser();
  }, []);

  useEffect(() => {
    const token = getAuthToken();
    if (!token || !user) {
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
        setStompClient(null);
        setConnected(false);
      }
      return;
    }

    // Load initial counts
    getUnreadCount().then(setUnreadCount).catch(console.error);
    getUnreadNotificationsCount().then(setUnreadNotificationsCount).catch(console.error);

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    const wsUrl = API_BASE.replace(/^http/, "ws") + "/ws-chat/websocket";

    const client = new Client({
      brokerURL: wsUrl,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      setConnected(true);
      
      // Subscribe to user inbox notifications
      client.subscribe(`/topic/users/${user.id}/inbox`, (message) => {
        getUnreadCount().then(setUnreadCount).catch(console.error);
        try {
          const body = JSON.parse(message.body);
          const event = new CustomEvent("inbox-update", { detail: body });
          window.dispatchEvent(event);
        } catch (e) {
          console.error(e);
        }
      });

      // Subscribe to user alerts (likes, comments, messages, mentions)
      client.subscribe(`/topic/users/${user.id}/notifications`, (message) => {
        getUnreadNotificationsCount().then(setUnreadNotificationsCount).catch(console.error);
        try {
          const body = JSON.parse(message.body);
          const event = new CustomEvent("notification-received", { detail: body });
          window.dispatchEvent(event);
        } catch (e) {
          console.error(e);
        }
      });
    };

    client.onDisconnect = () => {
      setConnected(false);
    };

    client.onStompError = (frame) => {
      console.error("Broker error: " + frame.headers["message"]);
    };

    client.activate();
    clientRef.current = client;
    setStompClient(client);

    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
        setStompClient(null);
        setConnected(false);
      }
    };
  }, [user]);

  return (
    <SocketContext.Provider
      value={{
        stompClient,
        unreadCount,
        setUnreadCount,
        unreadNotificationsCount,
        setUnreadNotificationsCount,
        connected,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
