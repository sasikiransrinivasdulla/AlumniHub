# Final Stabilization & Polish — Tasks

- [x] Implement GET `/api/chat/conversations/{id}` in `ChatController.java`
- [x] Implement `getConversation` in `chatService.ts`
- [x] Resolve conversation ID query parameter bug in `messages/page.tsx`
- [x] Add composite indexes in Hibernate:
  - [x] `idx_messages_conversation_created` on `messages` table
  - [x] `idx_notifications_recipient_created` on `notifications` table
  - [x] `idx_comments_post_created` on `comments` table
- [x] Resolve browser hydration mismatch warnings:
  - [x] `reunions/page.tsx`
  - [x] `Sidebar.tsx`
  - [x] `referrals/page.tsx`
  - [x] `achievements/page.tsx`
  - [x] `messages/page.tsx`
  - [x] `alumni/[id]/page.tsx`
  - [x] `events/page.tsx`
  - [x] `dashboard/page.tsx`
- [x] Verify compilation and production builds
