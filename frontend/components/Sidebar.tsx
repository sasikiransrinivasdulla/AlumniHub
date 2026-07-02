"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { clearAuth, UserProfile } from "@/services/authService";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
  user: UserProfile | null;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeDrawer, setActiveDrawer] = useState<"search" | "messages" | "notifications" | null>(null);

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
      action: () => setActiveDrawer(activeDrawer === "messages" ? null : "messages"),
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
            <span className="hidden md:block font-light text-[22px] tracking-[0.2em] text-white uppercase select-none leading-none">
              Alumni Hub
            </span>
          </Link>

          {/* Navigation Items */}
          <nav className="flex flex-col space-y-3">
            {navItems.map((item, idx) => {
              const isActive = item.href ? pathname === item.href : false;

              const content = (
                <motion.div
                  whileHover={{ x: 6 }}
                  className={`flex items-center gap-5 py-4 px-4 rounded-2xl transition-colors duration-200 ${
                    isActive ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                >
                  {item.isProfile ? (
                    <div className="relative w-7 h-7 rounded-full overflow-hidden border border-white/20 bg-neutral-900 flex items-center justify-center flex-shrink-0">
                      {user?.profilePicture ? (
                        <Image
                          src={user.profilePicture}
                          alt="Profile picture"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <span className="text-[11px] text-white font-bold uppercase">
                          {user?.fullName?.charAt(0) || "U"}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className={`transition-transform duration-200 ${isActive ? "scale-110 text-white" : "text-neutral-400"}`}>
                      {item.icon}
                    </div>
                  )}

                  <span
                    className={`hidden md:block text-[18px] tracking-wide font-light ${
                      isActive ? "text-white font-semibold" : "text-neutral-300"
                    }`}
                  >
                    {item.label === "Profile" ? "My Profile" : item.label}
                  </span>
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

      {/* Slide-out drawer for Coming Soon features */}
      <AnimatePresence>
        {activeDrawer && (
          <>
            {/* Backdrop to close drawer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveDrawer(null)}
              className="fixed inset-0 bg-black/60 z-30 ml-20 md:ml-72"
            />
            {/* Drawer body */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-20 md:left-72 top-0 bottom-0 w-96 glass-panel z-35 flex flex-col justify-center items-center px-10 text-center select-none border-y-0 border-l-0"
            >
              <div className="space-y-6">
                <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center mx-auto text-neutral-400">
                  {activeDrawer === "search" && (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                  {activeDrawer === "messages" && (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  )}
                  {activeDrawer === "notifications" && (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  )}
                </div>
                <h3 className="text-xl font-light tracking-widest uppercase text-white">
                  {activeDrawer}
                </h3>
                <p className="text-[17px] text-neutral-400 font-light leading-relaxed">
                  We are currently developing this module. It will be available in the next version of Alumni Hub.
                </p>
                <button
                  onClick={() => setActiveDrawer(null)}
                  className="mt-6 text-[15px] font-semibold tracking-widest uppercase border border-white/10 hover:border-white px-6 py-3 transition-colors duration-200 rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
