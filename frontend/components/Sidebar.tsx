"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { clearAuth, UserProfile } from "@/services/authService";
import { useSocket } from "@/context/SocketContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  NotificationDto,
} from "@/services/notificationService";

interface SidebarProps {
  user: UserProfile | null;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { unreadCount, unreadNotificationsCount, setUnreadNotificationsCount } = useSocket();
  const [activeDrawer, setActiveDrawer] = useState<"search" | "notifications" | null>(null);

  // Notifications Drawer States
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  // Search Drawer States
  const [searchVal, setSearchVal] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (activeDrawer === "notifications") {
      setNotificationsLoading(true);
      getNotifications()
        .then((res) => {
          setNotifications(res && Array.isArray(res.content) ? res.content : []);
          markAllNotificationsAsRead()
            .then(() => setUnreadNotificationsCount(0))
            .catch(console.error);
        })
        .catch(console.error)
        .finally(() => setNotificationsLoading(false));
    }
  }, [activeDrawer, setUnreadNotificationsCount]);

  useEffect(() => {
    const handleNotificationReceived = (e: Event) => {
      const customEvent = e as CustomEvent<NotificationDto>;
      const newNotif = customEvent.detail;
      if (activeDrawer === "notifications") {
        setNotifications((prev) => {
          const currentNotifications = Array.isArray(prev) ? prev : [];
          return [newNotif, ...currentNotifications];
        });
        markNotificationAsRead(newNotif.id).catch(console.error);
      }
    };
    window.addEventListener("notification-received", handleNotificationReceived);
    return () => {
      window.removeEventListener("notification-received", handleNotificationReceived);
    };
  }, [activeDrawer]);

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  const handleSearchDrawerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchVal(val);
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }
    searchDebounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const { searchAlumniDirectory } = await import("@/services/alumniService");
        const list = await searchAlumniDirectory(val.trim());
        setSearchResults(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error(err);
      } finally {
        setSearchLoading(false);
      }
    }, 250);
  };

  const handleLogout = () => {
    clearAuth();
    router.push("/");
  };

  const navItems = [
    {
      label: "Feed",
      href: "/dashboard",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      label: "Search",
      action: () => setActiveDrawer(activeDrawer === "search" ? null : "search"),
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      label: "Messages",
      href: "/messages",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      label: "Notifications",
      action: () => setActiveDrawer(activeDrawer === "notifications" ? null : "notifications"),
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
    {
      label: "Directory",
      href: "/directory",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      label: "Profile",
      href: "/profile",
      isProfile: true,
    },
  ];

  return (
    <>
      {/* Sidebar container */}
      <aside className="fixed left-0 top-0 bottom-0 w-20 md:w-72 glass-panel flex flex-col justify-between py-10 px-5 z-40 select-none border-y-0 border-l-0">
        <div className="flex flex-col space-y-12">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-4 px-2">
            <div className="relative w-10 h-10 flex-shrink-0">
              <Image
                src="/AHlogo.png"
                alt="Alumni Hub Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="hidden md:block font-extralight text-[20px] tracking-[0.3em] bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/60 uppercase select-none leading-none">
              ALUMNI HUB
            </span>
          </Link>

          {/* Navigation Items */}
          <nav className="flex flex-col space-y-3">
            {navItems.map((item, idx) => {
              const isActive = item.href ? pathname === item.href : false;

              const content = (
                <motion.div
                  whileHover={{ x: 4 }}
                  className={`relative flex items-center gap-5 py-3.5 px-4 rounded-xl transition-all duration-300 ${
                    isActive 
                      ? "bg-white/[0.08] border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.03)] text-white" 
                      : "hover:bg-white/[0.04] border border-transparent text-neutral-400 hover:text-white"
                  }`}
                >
                  {/* Left Active Indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute left-1 w-[3px] h-[50%] bg-white rounded-full"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}

                  {item.isProfile ? (
                    <div className="relative w-6 h-6 rounded-full overflow-hidden border border-white/20 bg-neutral-900 flex items-center justify-center flex-shrink-0 ml-1.5">
                      {user?.profilePicture ? (
                        <Image
                          src={user.profilePicture}
                          alt="Profile picture"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <span className="text-[10px] text-white font-medium uppercase">
                          {user?.fullName?.charAt(0) || "U"}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className={`relative transition-all duration-300 ml-1.5 ${isActive ? "scale-105 text-white" : "text-neutral-400"}`}>
                      {item.icon}
                      {item.label === "Messages" && unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-white text-black font-bold text-[9px] w-4.5 h-4.5 flex items-center justify-center rounded-full border border-black shadow">
                          {unreadCount}
                        </span>
                      )}
                      {item.label === "Notifications" && unreadNotificationsCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-white text-black font-bold text-[9px] w-4.5 h-4.5 flex items-center justify-center rounded-full border border-black shadow">
                          {unreadNotificationsCount}
                        </span>
                      )}
                    </div>
                  )}

                  <span
                    className={`hidden md:block text-[15px] tracking-wider font-light ${
                      isActive ? "text-white font-medium" : "text-neutral-300"
                    }`}
                  >
                    {item.label === "Profile" ? "My Profile" : item.label}
                  </span>

                  {item.label === "Messages" && unreadCount > 0 && (
                    <span className="hidden md:flex bg-white text-black font-bold text-[10px] w-5 h-5 rounded-full items-center justify-center ml-auto">
                      {unreadCount}
                    </span>
                  )}
                  {item.label === "Notifications" && unreadNotificationsCount > 0 && (
                    <span className="hidden md:flex bg-white text-black font-bold text-[10px] w-5 h-5 rounded-full items-center justify-center ml-auto">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </motion.div>
              );

              if (item.action) {
                return (
                  <button
                    key={idx}
                    onClick={item.action}
                    className="w-full text-left focus:outline-none cursor-pointer"
                  >
                    {content}
                  </button>
                );
              }

              return (
                <Link key={idx} href={item.href || "#"}>
                  {content}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full text-left focus:outline-none cursor-pointer flex items-center gap-5 py-4 px-4 rounded-2xl hover:bg-white/5 transition-colors duration-200 text-neutral-400 hover:text-white"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="hidden md:block text-[18px] tracking-wide font-light">
            Logout
          </span>
        </button>
      </aside>

      {/* Slide-out drawer */}
      <AnimatePresence>
        {activeDrawer && (
          <>
            {/* Backdrop to close drawer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setActiveDrawer(null)}
              className="fixed inset-0 bg-black/75 backdrop-blur-[26px] z-30 ml-20 md:ml-72"
            />
            {/* Drawer body */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-20 md:left-72 top-0 bottom-0 w-96 glass-panel z-35 flex flex-col justify-start px-6 py-10 select-none border-y-0 border-l-0 text-left"
            >
              {activeDrawer === "notifications" ? (
                <div className="flex flex-col h-full w-full">
                  <h3 className="text-[18px] font-light tracking-[0.2em] uppercase text-white mb-6 border-b border-white/5 pb-4">
                    Notifications
                  </h3>
                  
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                    {notificationsLoading ? (
                      <div className="text-center text-[15px] text-neutral-500 uppercase tracking-widest py-10 animate-pulse">
                        Loading...
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="text-center text-[15px] text-neutral-500 uppercase tracking-widest py-10">
                        No notifications
                      </div>
                    ) : (
                      Array.isArray(notifications) && notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                        >
                          <div className="relative w-9 h-9 rounded-full overflow-hidden border border-white/10 bg-neutral-900 flex items-center justify-center flex-shrink-0">
                            {notif.senderProfilePicture ? (
                              <Image
                                src={notif.senderProfilePicture}
                                alt={notif.senderName}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <span className="text-[12px] font-bold text-white uppercase">
                                {notif.senderName.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] text-neutral-200 leading-tight">
                              <span className="font-semibold text-white">{notif.senderName}</span>{" "}
                              {notif.text}
                            </p>
                            <span className="text-[11px] text-neutral-500 mt-1 block">
                              {new Date(notif.createdAt).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <button
                    onClick={() => setActiveDrawer(null)}
                    className="mt-6 text-[13px] font-semibold tracking-widest uppercase border border-white/10 hover:border-white px-6 py-3 transition-colors duration-200 rounded-xl cursor-pointer text-center"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <div className="flex flex-col h-full w-full">
                  <h3 className="text-[22px] font-light tracking-widest uppercase text-white mb-4">
                    Search
                  </h3>
                  <input
                    type="text"
                    placeholder="Search classmates..."
                    value={searchVal}
                    onChange={handleSearchDrawerChange}
                    className="w-full glass-input text-[15px] p-3.5 rounded-xl mb-6 focus:outline-none"
                  />
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {searchLoading ? (
                      <div className="text-center text-[15px] text-neutral-500 uppercase tracking-widest py-10 animate-pulse">
                        Searching...
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="text-center text-[15px] text-neutral-500 uppercase tracking-widest py-10">
                        {searchVal ? "No results found" : "Type to search"}
                      </div>
                    ) : (
                      Array.isArray(searchResults) && searchResults.map((res) => (
                        <div
                          key={res.id}
                          onClick={() => {
                            setActiveDrawer(null);
                            router.push(`/alumni/${res.id}`);
                          }}
                          className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors cursor-pointer"
                        >
                          <div className="relative w-9 h-9 rounded-full overflow-hidden border border-white/10 bg-neutral-900 flex items-center justify-center flex-shrink-0">
                            {res.profilePicture ? (
                              <Image
                                src={res.profilePicture}
                                alt={res.fullName}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <span className="text-[12px] font-bold text-white uppercase">
                                {res.fullName.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[14px] font-semibold text-white truncate leading-none mb-1">
                              {res.fullName}
                            </h4>
                            <p className="text-[12px] text-neutral-450 truncate leading-none">
                              {res.currentPosition || "Alumni Member"}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <button
                    onClick={() => setActiveDrawer(null)}
                    className="mt-6 text-[13px] font-semibold tracking-widest uppercase border border-white/10 hover:border-white px-6 py-3 transition-colors duration-200 rounded-xl cursor-pointer text-center"
                  >
                    Close
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
