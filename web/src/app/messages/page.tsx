'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { apiFetch, getToken, getUser } from '@/lib/api';
import { usePusherChannel } from '@/hooks/usePusher';
import { timeAgo } from '@/lib/format';

// ==================== TYPES ====================
interface Conversation {
  id: string;
  type: 'DIRECT' | 'GROUP';
  name: string;
  avatar: string | null;
  username: string | null;
  userId: string | null;
  memberCount?: number;
  lastMessage: { content: string; createdAt: string; isOwn: boolean } | null;
  unread: boolean;
}

interface ReplyTo {
  id: string;
  content: string | null;
  senderId: string;
  type: string;
  sender: { id: string; displayName: string };
}

interface ReadReceipt {
  userId: string;
  readAt: string;
}

interface ChatMessage {
  id: string;
  content: string | null;
  senderId: string;
  createdAt: string;
  type: string;
  mediaUrl: string | null;
  mediaType: string | null;
  isEdited: boolean;
  editedAt: string | null;
  isDeleted: boolean;
  deletedForAll: boolean;
  replyToId: string | null;
  replyTo: ReplyTo | null;
  audioDuration: number | null;
  fileName: string | null;
  fileSize: number | null;
  sender: { id: string; username: string; displayName: string; avatarUrl: string | null };
  readBy: ReadReceipt[];
  // client-only
  status?: 'sending' | 'sent' | 'read' | 'failed';
}

interface GroupMember {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

interface SearchResult { id: string; username: string; displayName: string; }

// ==================== ICONS ====================
function ArrowLeftIcon() { return <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#F0F0F8" strokeWidth={2} strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>; }
function SendIcon() { return <svg width={20} height={20} viewBox="0 0 24 24" fill="#0A0A0F" stroke="none"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>; }
function PenIcon() { return <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#F0F0F8" strokeWidth={1.5}><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>; }
function SearchIconSm() { return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#5C5C72" strokeWidth={2}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>; }
function ChatBubbleIcon() { return <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#5C5C72" strokeWidth={1}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>; }
function GroupPlusIcon() { return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="23" y1="11" x2="17" y2="11" /><line x1="20" y1="8" x2="20" y2="14" /></svg>; }
function TrophySmIcon() { return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#FFB800" strokeWidth={1.5}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22h10c0-2-.85-3.25-2.03-3.79A1.07 1.07 0 0 1 14 17v-2.34" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>; }
function GroupIcon() { return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#5C5C72" strokeWidth={1.5}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>; }
function MicIcon({ color = '#F0F0F8' }: { color?: string }) { return <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>; }
function PaperclipIcon() { return <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#9494AC" strokeWidth={2}><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>; }
function ImageIcon() { return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#9494AC" strokeWidth={2}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>; }
function CloseIcon() { return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>; }
function EditIcon() { return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>; }
function TrashIcon() { return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>; }
function ReplyIcon() { return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="9 17 4 12 9 7" /><path d="M20 18v-2a4 4 0 0 0-4-4H4" /></svg>; }
function PlayIcon() { return <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>; }
function PauseIcon() { return <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>; }
function StopIcon() { return <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2" /></svg>; }

// Fire status icon: gray = sent, orange animated = read, warning = failed
function FireStatus({ status }: { status: 'sending' | 'sent' | 'read' | 'failed' }) {
  if (status === 'failed') {
    return (
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#FFB800" strokeWidth={2.5}>
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    );
  }
  if (status === 'sending') {
    return (
      <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#5C5C72" strokeWidth={2} style={{ opacity: 0.5 }}>
        <circle cx="12" cy="12" r="10" strokeDasharray="31.4" strokeDashoffset="10">
          <animateTransform attributeName="transform" type="rotate" dur="1s" from="0 12 12" to="360 12 12" repeatCount="indefinite" />
        </circle>
      </svg>
    );
  }
  const isRead = status === 'read';
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" className={isRead ? 'fire-read' : ''}>
      <path
        d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14 0-5.5 3-7 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.4-2.15 1-3 .22.65.84 1.3 1.5 1.5z"
        fill={isRead ? '#FF6B35' : 'none'}
        stroke={isRead ? '#FF6B35' : '#5C5C72'}
        strokeWidth={1.5}
        style={isRead ? { filter: 'drop-shadow(0 0 4px rgba(255,107,53,0.6))' } : {}}
      />
    </svg>
  );
}

// Emoji quick-pick
const QUICK_EMOJIS = ['😂', '❤️', '🔥', '💪', '👏', '😍', '🎉', '👍', '😢', '🤔', '😎', '🙏', '💯', '🏋️', '🏃', '⚡'];

// ==================== COMPONENT ====================
export default function MessagesPage() {
  const router = useRouter();
  const currentUser = getUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [activeChatType, setActiveChatType] = useState<'DIRECT' | 'GROUP'>('DIRECT');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Group members (for mentions)
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);

  // UI states
  const [showEmojis, setShowEmojis] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ msgId: string; x: number; y: number } | null>(null);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);

  // Audio recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);

  // Create group modal
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [searchMember, setSearchMember] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<SearchResult[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!getToken()) { router.push('/login'); return; }
    loadConversations();
  }, [router]);

  // Close context menu on outside click
  useEffect(() => {
    function handleClick() { setContextMenu(null); }
    if (contextMenu) {
      window.addEventListener('click', handleClick);
      return () => window.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  async function loadConversations() {
    try {
      const res = await apiFetch('/api/conversations');
      if (res.ok) setConversations(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function openChat(conv: Conversation) {
    setActiveChat(conv.id);
    setActiveChatType(conv.type);
    setLoadingMessages(true);
    setGroupMembers([]);
    setReplyTo(null);
    setEditingMsgId(null);
    setShowEmojis(false);
    try {
      const res = await apiFetch(`/api/messages/${conv.id}`);
      if (res.ok) {
        const msgs = await res.json();
        setMessages(msgs.map((m: ChatMessage) => ({
          ...m,
          status: m.senderId === currentUser?.id
            ? (m.readBy.length > 0 ? 'read' : 'sent')
            : undefined,
        })));
        setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unread: false } : c));
      }
    } catch { /* ignore */ }
    setLoadingMessages(false);

    if (conv.type === 'GROUP') {
      try {
        const res = await apiFetch('/api/groups');
        if (res.ok) {
          const groups = await res.json();
          const g = groups.find((x: { id: string }) => x.id === conv.id);
          if (g?.members) setGroupMembers(g.members.filter((m: GroupMember) => m.id !== currentUser?.id));
        }
      } catch { /* ignore */ }
    }

    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    inputRef.current?.focus();
  }

  // ==================== SEND MESSAGE ====================
  async function sendMessage() {
    if (!newMessage.trim() || !activeChat || sending) return;
    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');
    setShowMentions(false);
    setShowEmojis(false);

    const tempId = `temp-${Date.now()}`;
    const tempMsg: ChatMessage = {
      id: tempId, content, senderId: currentUser?.id || '', createdAt: new Date().toISOString(),
      type: 'TEXT', mediaUrl: null, mediaType: null, isEdited: false, editedAt: null,
      isDeleted: false, deletedForAll: false, replyToId: replyTo?.id || null,
      replyTo: replyTo ? { id: replyTo.id, content: replyTo.content, senderId: replyTo.senderId, type: replyTo.type, sender: { id: replyTo.sender.id, displayName: replyTo.sender.displayName } } : null,
      audioDuration: null, fileName: null, fileSize: null,
      sender: { id: currentUser?.id || '', username: currentUser?.username || '', displayName: currentUser?.displayName || '', avatarUrl: null },
      readBy: [], status: 'sending',
    };
    setMessages(prev => [...prev, tempMsg]);
    setReplyTo(null);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

    try {
      const res = await apiFetch(`/api/messages/${activeChat}`, {
        method: 'POST',
        body: JSON.stringify({ content, replyToId: tempMsg.replyToId }),
      });
      if (res.ok) {
        const realMsg = await res.json();
        setMessages(prev => prev.map(m => m.id === tempId ? { ...realMsg, status: 'sent' } : m));
        setConversations(prev => prev.map(c =>
          c.id === activeChat ? { ...c, lastMessage: { content, createdAt: realMsg.createdAt, isOwn: true } } : c
        ));
      } else {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m));
      }
    } catch {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m));
    }
    setSending(false);
    inputRef.current?.focus();
  }

  // ==================== MEDIA UPLOAD ====================
  async function uploadAndSend(file: File, type: string) {
    if (!activeChat) return;

    const tempId = `temp-${Date.now()}`;
    const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
    const tempMsg: ChatMessage = {
      id: tempId, content: null, senderId: currentUser?.id || '', createdAt: new Date().toISOString(),
      type, mediaUrl: previewUrl, mediaType: file.type.startsWith('video/') ? 'VIDEO' : file.type.startsWith('audio/') ? 'AUDIO' : 'IMAGE',
      isEdited: false, editedAt: null, isDeleted: false, deletedForAll: false,
      replyToId: replyTo?.id || null, replyTo: null, audioDuration: null, fileName: file.name, fileSize: file.size,
      sender: { id: currentUser?.id || '', username: currentUser?.username || '', displayName: currentUser?.displayName || '', avatarUrl: null },
      readBy: [], status: 'sending',
    };
    setMessages(prev => [...prev, tempMsg]);
    setReplyTo(null);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('access_token');
      const uploadRes = await fetch('/api/messages/upload', {
        method: 'POST', body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!uploadRes.ok) throw new Error('Upload failed');
      const { mediaUrl, mediaType, fileName, fileSize } = await uploadRes.json();

      const res = await apiFetch(`/api/messages/${activeChat}`, {
        method: 'POST',
        body: JSON.stringify({ content: null, type, mediaUrl, mediaType, fileName, fileSize, replyToId: tempMsg.replyToId }),
      });
      if (res.ok) {
        const realMsg = await res.json();
        setMessages(prev => prev.map(m => m.id === tempId ? { ...realMsg, status: 'sent' } : m));
      } else {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m));
      }
    } catch {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m));
    }
  }

  // ==================== AUDIO RECORDING ====================
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `audio_${Date.now()}.webm`, { type: 'audio/webm' });
        uploadAndSend(file, 'AUDIO');
      };
      recorder.start(100);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordTime(0);
      recordTimerRef.current = window.setInterval(() => {
        setRecordTime(prev => prev + 1);
      }, 1000);
    } catch {
      // Mic not available
    }
  }

  function stopRecording() {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }

  function cancelRecording() {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      if (mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
    setIsRecording(false);
  }

  // ==================== EDIT / DELETE ====================
  async function editMessage(msgId: string, newContent: string) {
    if (!activeChat || !newContent.trim()) return;
    setEditingMsgId(null);
    try {
      const res = await apiFetch(`/api/messages/${activeChat}`, {
        method: 'PATCH',
        body: JSON.stringify({ messageId: msgId, content: newContent.trim() }),
      });
      if (res.ok) {
        const updated = await res.json();
        setMessages(prev => prev.map(m => m.id === msgId ? { ...updated, status: m.status } : m));
      }
    } catch { /* ignore */ }
  }

  async function deleteMessage(msgId: string, forAll: boolean) {
    if (!activeChat) return;
    setContextMenu(null);
    try {
      await apiFetch(`/api/messages/${activeChat}?messageId=${msgId}&forAll=${forAll}`, { method: 'DELETE' });
      if (forAll) {
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, deletedForAll: true, content: null, mediaUrl: null } : m));
      } else {
        setMessages(prev => prev.filter(m => m.id !== msgId));
      }
    } catch { /* ignore */ }
  }

  // ==================== MENTIONS ====================
  function handleInputChange(value: string) {
    setNewMessage(value);
    const cursorPos = inputRef.current?.selectionStart || value.length;
    const textBeforeCursor = value.slice(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);
    if (atMatch && activeChatType === 'GROUP' && groupMembers.length > 0) {
      setMentionFilter(atMatch[1].toLowerCase());
      setShowMentions(true);
      setMentionIndex(0);
    } else {
      setShowMentions(false);
    }
  }

  function insertMention(member: GroupMember) {
    const cursorPos = inputRef.current?.selectionStart || newMessage.length;
    const textBeforeCursor = newMessage.slice(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    const before = newMessage.slice(0, atIndex);
    const after = newMessage.slice(cursorPos);
    setNewMessage(`${before}@${member.username} ${after}`);
    setShowMentions(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (showMentions) {
      const filtered = groupMembers.filter(m =>
        m.username.toLowerCase().includes(mentionFilter) || m.displayName.toLowerCase().includes(mentionFilter)
      );
      if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIndex(prev => Math.min(prev + 1, filtered.length - 1)); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setMentionIndex(prev => Math.max(prev - 1, 0)); return; }
      if ((e.key === 'Enter' || e.key === 'Tab') && filtered[mentionIndex]) { e.preventDefault(); insertMention(filtered[mentionIndex]); return; }
      if (e.key === 'Escape') { setShowMentions(false); return; }
    }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    if (e.key === 'Escape' && replyTo) { setReplyTo(null); }
  }

  // ==================== REAL-TIME EVENTS ====================
  const handleNewMessage = useCallback((data: unknown) => {
    const msg = data as ChatMessage & { conversationId: string };
    if (msg.senderId === currentUser?.id) return;
    if (msg.conversationId === activeChat) {
      setMessages(prev => [...prev, msg]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      // Auto mark as read
      apiFetch(`/api/messages/${msg.conversationId}/read`, {
        method: 'POST', body: JSON.stringify({ messageIds: [msg.id] }),
      }).catch(() => {});
    }
    setConversations(prev => prev.map(c =>
      c.id === msg.conversationId
        ? { ...c, lastMessage: { content: msg.content || '[Mídia]', createdAt: msg.createdAt, isOwn: false }, unread: msg.conversationId !== activeChat }
        : c
    ));
  }, [activeChat, currentUser?.id]);

  const handleMessagesRead = useCallback((data: unknown) => {
    const { readByUserId, messageIds } = data as { readByUserId: string; messageIds: string[]; readAt: string };
    if (readByUserId === currentUser?.id) return;
    setMessages(prev => prev.map(m =>
      messageIds.includes(m.id) ? { ...m, status: 'read', readBy: [...m.readBy, { userId: readByUserId, readAt: new Date().toISOString() }] } : m
    ));
  }, [currentUser?.id]);

  const handleMessageEdited = useCallback((data: unknown) => {
    const msg = data as ChatMessage & { conversationId: string };
    if (msg.senderId === currentUser?.id) return;
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...msg, status: m.status } : m));
  }, [currentUser?.id]);

  const handleMessageDeleted = useCallback((data: unknown) => {
    const { messageId, forAll } = data as { messageId: string; conversationId: string; forAll: boolean };
    if (forAll) {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, deletedForAll: true, content: null, mediaUrl: null } : m));
    }
  }, []);

  usePusherChannel(activeChat ? `chat-${activeChat}` : '', 'new-message', handleNewMessage, !!activeChat);
  usePusherChannel(activeChat ? `chat-${activeChat}` : '', 'messages-read', handleMessagesRead, !!activeChat);
  usePusherChannel(activeChat ? `chat-${activeChat}` : '', 'message-edited', handleMessageEdited, !!activeChat);
  usePusherChannel(activeChat ? `chat-${activeChat}` : '', 'message-deleted', handleMessageDeleted, !!activeChat);

  // ==================== CREATE GROUP ====================
  async function searchUsers(query: string) {
    setSearchMember(query);
    if (query.length < 2) { setSearchResults([]); return; }
    try {
      const res = await apiFetch(`/api/users/search/${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.filter((u: SearchResult) => u.id !== currentUser?.id && !selectedMembers.some(m => m.id === u.id)));
      }
    } catch { /* ignore */ }
  }

  async function createGroup() {
    if (!newGroupName.trim() || creating) return;
    setCreating(true);
    try {
      const res = await apiFetch('/api/groups', {
        method: 'POST',
        body: JSON.stringify({ name: newGroupName.trim(), memberIds: selectedMembers.map(m => m.id) }),
      });
      if (res.ok) {
        setShowCreateGroup(false); setNewGroupName(''); setSelectedMembers([]); setSearchMember('');
        await loadConversations();
      }
    } catch { /* ignore */ }
    setCreating(false);
  }

  // ==================== RENDER HELPERS ====================
  const activeConv = conversations.find(c => c.id === activeChat);
  const filteredConvs = search ? conversations.filter(c => c.name?.toLowerCase().includes(search.toLowerCase())) : conversations;
  const showChatView = !!activeChat;
  const filteredMentions = groupMembers.filter(m =>
    m.username.toLowerCase().includes(mentionFilter) || m.displayName.toLowerCase().includes(mentionFilter)
  ).slice(0, 6);

  function renderContent(text: string) {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) =>
      part.startsWith('@') ? <span key={i} style={{ color: '#FF6B35', fontWeight: 600 }}>{part}</span> : <span key={i}>{part}</span>
    );
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatRecordTime(secs: number) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  // ==================== AUDIO PLAYER COMPONENT ====================
  function AudioPlayer({ src, duration }: { src: string; duration?: number | null }) {
    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '180px' }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (audioRef.current) {
              if (playing) { audioRef.current.pause(); } else { audioRef.current.play(); }
              setPlaying(!playing);
            }
          }}
          style={{
            width: '32px', height: '32px', borderRadius: '50%', border: 'none',
            background: 'rgba(255,255,255,0.15)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0,
          }}
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.15)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress * 100}%`, background: '#fff', borderRadius: '2px', transition: 'width 100ms' }} />
          </div>
        </div>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
          {duration ? `${Math.floor(duration / 60)}:${Math.floor(duration % 60).toString().padStart(2, '0')}` : '--:--'}
        </span>
        <audio
          ref={audioRef}
          src={src}
          onTimeUpdate={() => {
            if (audioRef.current && audioRef.current.duration) setProgress(audioRef.current.currentTime / audioRef.current.duration);
          }}
          onEnded={() => { setPlaying(false); setProgress(0); }}
        />
      </div>
    );
  }

  // ==================== RENDER ====================
  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F' }}>
      <Navbar />
      <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>

        {/* ===== CONVERSATION LIST ===== */}
        <div className="chat-list-panel" style={{
          width: '340px', borderRight: '1px solid rgba(148,148,172,0.08)',
          display: showChatView ? undefined : 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden',
        }}>
          <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(148,148,172,0.08)' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#F0F0F8', margin: 0 }}>Mensagens</h1>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowCreateGroup(true)} title="Criar grupo" style={{
                background: 'none', border: '1px solid rgba(148,148,172,0.12)', cursor: 'pointer',
                padding: '6px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px',
                color: '#FF6B35', fontSize: '12px', fontWeight: 600,
              }}><GroupPlusIcon /> Grupo</button>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}><PenIcon /></button>
            </div>
          </div>

          <div style={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#141420', borderRadius: '10px', padding: '8px 12px', border: '1px solid rgba(148,148,172,0.08)' }}>
              <SearchIconSm />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar conversa..." style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#F0F0F8', fontSize: '14px' }} />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', padding: '12px 16px' }}>
                  <div className="shimmer" style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#141420', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="shimmer" style={{ width: '120px', height: '14px', borderRadius: '4px', background: '#141420', marginBottom: '6px' }} />
                    <div className="shimmer" style={{ width: '180px', height: '12px', borderRadius: '4px', background: '#141420' }} />
                  </div>
                </div>
              ))
            ) : filteredConvs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <ChatBubbleIcon />
                <p style={{ color: '#5C5C72', fontSize: '14px', margin: '12px 0 0' }}>{search ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}</p>
              </div>
            ) : (
              filteredConvs.map(conv => (
                <button key={conv.id} onClick={() => openChat(conv)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 16px', background: activeChat === conv.id ? 'rgba(255,107,53,0.06)' : 'transparent',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                  borderLeft: activeChat === conv.id ? '3px solid #FF6B35' : '3px solid transparent', transition: 'all 150ms',
                }}>
                  <div style={{
                    width: '50px', height: '50px', borderRadius: conv.type === 'GROUP' ? '14px' : '50%', flexShrink: 0,
                    background: conv.avatar ? 'transparent' : 'linear-gradient(135deg, #FF6B35, #E05520)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: '18px', overflow: 'hidden',
                  }}>
                    {conv.avatar ? <img src={conv.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (conv.name || '?')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                        <span style={{ fontSize: '14px', fontWeight: conv.unread ? 700 : 600, color: conv.unread ? '#F0F0F8' : '#9494AC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.name}</span>
                        {conv.type === 'GROUP' && <GroupIcon />}
                      </div>
                      {conv.lastMessage && <span style={{ fontSize: '11px', color: conv.unread ? '#FF6B35' : '#5C5C72', flexShrink: 0, marginLeft: '8px' }}>{timeAgo(conv.lastMessage.createdAt)}</span>}
                    </div>
                    {conv.type === 'GROUP' && conv.memberCount && <div style={{ fontSize: '11px', color: '#5C5C72', marginTop: '1px' }}>{conv.memberCount} membros</div>}
                    {conv.lastMessage && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <span style={{ fontSize: '13px', color: conv.unread ? '#F0F0F8' : '#5C5C72', fontWeight: conv.unread ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {conv.lastMessage.isOwn && 'Voce: '}{conv.lastMessage.content}
                        </span>
                        {conv.unread && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FF6B35', flexShrink: 0, marginLeft: 'auto' }} />}
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ===== CHAT VIEW ===== */}
        <div className="chat-view-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0A0A0F' }}>
          {!activeChat ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <ChatBubbleIcon />
              <p style={{ fontSize: '16px', fontWeight: 600, color: '#F0F0F8' }}>Suas mensagens</p>
              <p style={{ fontSize: '13px', color: '#5C5C72', textAlign: 'center', maxWidth: '280px' }}>Selecione uma conversa ou inicie uma nova para comecar a trocar mensagens.</p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: '1px solid rgba(148,148,172,0.08)' }}>
                <button onClick={() => { setActiveChat(null); setGroupMembers([]); }} className="chat-back-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'none' }}><ArrowLeftIcon /></button>
                <div style={{
                  width: '40px', height: '40px', borderRadius: activeChatType === 'GROUP' ? '12px' : '50%',
                  background: activeConv?.avatar ? 'transparent' : 'linear-gradient(135deg, #FF6B35, #E05520)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: '16px', overflow: 'hidden', flexShrink: 0,
                }}>
                  {activeConv?.avatar ? <img src={activeConv.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (activeConv?.name || '?')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#F0F0F8' }}>{activeConv?.name}</div>
                  {activeChatType === 'DIRECT' && activeConv?.username && <div style={{ fontSize: '12px', color: '#5C5C72' }}>@{activeConv.username}</div>}
                  {activeChatType === 'GROUP' && activeConv?.memberCount && <div style={{ fontSize: '12px', color: '#5C5C72' }}>{activeConv.memberCount} membros</div>}
                </div>
                {activeChatType === 'GROUP' && (
                  <Link href={`/groups/${activeChat}`} style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px',
                    background: 'rgba(255,184,0,0.1)', border: '1px solid rgba(255,184,0,0.2)',
                    textDecoration: 'none', color: '#FFB800', fontSize: '12px', fontWeight: 700,
                  }}><TrophySmIcon /> Ranking</Link>
                )}
              </div>

              {/* Messages area */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px', position: 'relative' }}>
                {loadingMessages ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#5C5C72', fontSize: '13px' }}>Carregando...</div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#5C5C72', fontSize: '13px' }}>Nenhuma mensagem ainda. Diga oi!</div>
                ) : (
                  messages.map((msg, i) => {
                    const isOwn = msg.senderId === currentUser?.id;
                    const showSenderName = !isOwn && activeChatType === 'GROUP' && (i === 0 || messages[i - 1].senderId !== msg.senderId);
                    const showAvatar = !isOwn && (i === 0 || messages[i - 1].senderId !== msg.senderId);
                    const time = new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    const msgStatus: 'sending' | 'sent' | 'read' | 'failed' = msg.status || (isOwn ? (msg.readBy.length > 0 ? 'read' : 'sent') : 'sent');

                    // Deleted for all
                    if (msg.deletedForAll) {
                      return (
                        <div key={msg.id} style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', marginTop: showAvatar ? '12px' : '1px' }}>
                          {!isOwn && <div style={{ width: '28px', flexShrink: 0 }} />}
                          <div style={{ padding: '8px 14px', borderRadius: '18px', background: 'rgba(148,148,172,0.05)', border: '1px solid rgba(148,148,172,0.08)' }}>
                            <span style={{ fontSize: '13px', color: '#5C5C72', fontStyle: 'italic' }}>Mensagem apagada</span>
                          </div>
                        </div>
                      );
                    }

                    // Editing mode
                    if (editingMsgId === msg.id) {
                      return (
                        <div key={msg.id} style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                          <div style={{ maxWidth: '70%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ fontSize: '11px', color: '#FF6B35', fontWeight: 600 }}>Editando mensagem</div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <input
                                autoFocus
                                value={editText}
                                onChange={e => setEditText(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') editMessage(msg.id, editText);
                                  if (e.key === 'Escape') setEditingMsgId(null);
                                }}
                                style={{
                                  flex: 1, padding: '10px 14px', borderRadius: '18px', background: '#1A1A28',
                                  border: '1px solid #FF6B35', color: '#F0F0F8', fontSize: '14px', outline: 'none',
                                }}
                              />
                              <button onClick={() => editMessage(msg.id, editText)} style={{
                                background: '#FF6B35', border: 'none', borderRadius: '50%', width: '32px', height: '32px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                              }}>
                                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#0A0A0F" strokeWidth={3}><polyline points="20 6 9 17 4 12" /></svg>
                              </button>
                              <button onClick={() => setEditingMsgId(null)} style={{
                                background: 'rgba(148,148,172,0.1)', border: 'none', borderRadius: '50%', width: '32px', height: '32px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#9494AC',
                              }}><CloseIcon /></button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={msg.id} style={{
                        display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start',
                        alignItems: 'flex-end', gap: '8px', marginTop: showAvatar ? '12px' : '1px',
                      }}>
                        {!isOwn && (
                          <div style={{ width: '28px', flexShrink: 0 }}>
                            {showAvatar && (
                              <div style={{
                                width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden',
                                background: msg.sender.avatarUrl ? 'transparent' : 'linear-gradient(135deg, #FF6B35, #E05520)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontWeight: 700, fontSize: '11px',
                              }}>
                                {msg.sender.avatarUrl
                                  ? <img src={msg.sender.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  : msg.sender.displayName[0].toUpperCase()
                                }
                              </div>
                            )}
                          </div>
                        )}
                        <div
                          style={{ maxWidth: '70%' }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setContextMenu({ msgId: msg.id, x: e.clientX, y: e.clientY });
                          }}
                        >
                          {showSenderName && (
                            <div style={{ fontSize: '11px', color: '#FF6B35', fontWeight: 600, marginBottom: '2px', paddingLeft: '4px' }}>{msg.sender.displayName}</div>
                          )}

                          {/* Reply preview */}
                          {msg.replyTo && (
                            <div style={{
                              padding: '6px 12px', borderRadius: '10px 10px 0 0', marginBottom: '-4px',
                              background: isOwn ? 'rgba(200,70,20,0.3)' : 'rgba(148,148,172,0.08)',
                              borderLeft: '3px solid #FF6B35', fontSize: '12px',
                            }}>
                              <div style={{ color: '#FF6B35', fontWeight: 600, marginBottom: '2px' }}>{msg.replyTo.sender.displayName}</div>
                              <div style={{ color: isOwn ? 'rgba(255,255,255,0.6)' : '#9494AC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {msg.replyTo.content || '[Mídia]'}
                              </div>
                            </div>
                          )}

                          <div style={{
                            padding: msg.mediaUrl && !msg.content ? '4px' : '10px 14px',
                            borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                            background: isOwn ? '#FF6B35' : '#141420',
                            color: isOwn ? '#0A0A0F' : '#F0F0F8',
                            fontSize: '14px', lineHeight: 1.5, wordBreak: 'break-word',
                            position: 'relative', overflow: 'hidden',
                          }}>
                            {/* Image */}
                            {msg.mediaUrl && (msg.type === 'IMAGE' || msg.mediaType === 'IMAGE') && (
                              <div style={{ marginBottom: msg.content ? '8px' : '0', borderRadius: '14px', overflow: 'hidden' }}>
                                <img src={msg.mediaUrl} alt="" style={{ width: '100%', maxWidth: '280px', display: 'block', borderRadius: '14px' }} />
                              </div>
                            )}

                            {/* Video */}
                            {msg.mediaUrl && (msg.type === 'VIDEO' || msg.mediaType === 'VIDEO') && (
                              <div style={{ marginBottom: msg.content ? '8px' : '0', borderRadius: '14px', overflow: 'hidden' }}>
                                <video src={msg.mediaUrl} controls playsInline style={{ width: '100%', maxWidth: '280px', display: 'block', borderRadius: '14px' }} />
                              </div>
                            )}

                            {/* Audio */}
                            {msg.mediaUrl && (msg.type === 'AUDIO' || msg.mediaType === 'AUDIO') && (
                              <div style={{ padding: msg.content ? '0' : '8px 10px', minWidth: '220px' }}>
                                <AudioPlayer src={msg.mediaUrl} duration={msg.audioDuration} />
                              </div>
                            )}

                            {/* File attachment */}
                            {msg.mediaUrl && msg.type !== 'IMAGE' && msg.type !== 'VIDEO' && msg.type !== 'AUDIO' && msg.mediaType !== 'IMAGE' && msg.mediaType !== 'VIDEO' && msg.mediaType !== 'AUDIO' && msg.fileName && (
                              <a href={msg.mediaUrl} download={msg.fileName} target="_blank" rel="noreferrer" style={{
                                display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px',
                                textDecoration: 'none', color: 'inherit',
                              }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <PaperclipIcon />
                                </div>
                                <div>
                                  <div style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>{msg.fileName}</div>
                                  {msg.fileSize && <div style={{ fontSize: '11px', opacity: 0.6 }}>{formatFileSize(msg.fileSize)}</div>}
                                </div>
                              </a>
                            )}

                            {/* Text content */}
                            {msg.content && (
                              <div style={{ padding: msg.mediaUrl ? '6px 10px 0' : '0' }}>
                                {renderContent(msg.content)}
                              </div>
                            )}

                            {/* Footer: time + edited + status */}
                            <div style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px',
                              marginTop: '4px', paddingRight: msg.mediaUrl && !msg.content ? '8px' : '0',
                              paddingBottom: msg.mediaUrl && !msg.content ? '4px' : '0',
                            }}>
                              {msg.isEdited && <span style={{ fontSize: '9px', color: isOwn ? 'rgba(10,10,15,0.4)' : '#5C5C72', fontStyle: 'italic' }}>editada</span>}
                              <span style={{ fontSize: '9px', color: isOwn ? 'rgba(10,10,15,0.5)' : '#5C5C72', fontWeight: 500 }}>{time}</span>
                              {isOwn && <FireStatus status={msgStatus} />}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Context menu */}
              {contextMenu && (() => {
                const msg = messages.find(m => m.id === contextMenu.msgId);
                if (!msg) return null;
                const isOwn = msg.senderId === currentUser?.id;
                return (
                  <div style={{
                    position: 'fixed', left: contextMenu.x, top: contextMenu.y, zIndex: 100,
                    background: '#1A1A28', borderRadius: '12px', border: '1px solid rgba(148,148,172,0.12)',
                    overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', minWidth: '180px',
                  }}>
                    <button onClick={() => { setReplyTo(msg); setContextMenu(null); inputRef.current?.focus(); }} style={ctxBtnStyle}><ReplyIcon /> Responder</button>
                    {isOwn && msg.type === 'TEXT' && (
                      <button onClick={() => { setEditingMsgId(msg.id); setEditText(msg.content || ''); setContextMenu(null); }} style={ctxBtnStyle}><EditIcon /> Editar</button>
                    )}
                    <button onClick={() => deleteMessage(msg.id, false)} style={ctxBtnStyle}><TrashIcon /> Apagar para mim</button>
                    {isOwn && (
                      <button onClick={() => deleteMessage(msg.id, true)} style={{ ...ctxBtnStyle, color: '#FF4D6A' }}><TrashIcon /> Apagar para todos</button>
                    )}
                  </div>
                );
              })()}

              {/* Reply preview bar */}
              {replyTo && (
                <div style={{
                  padding: '8px 16px', background: '#141420',
                  borderTop: '1px solid rgba(148,148,172,0.08)', borderLeft: '3px solid #FF6B35',
                  display: 'flex', alignItems: 'center', gap: '10px',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '11px', color: '#FF6B35', fontWeight: 600 }}>{replyTo.sender.displayName}</div>
                    <div style={{ fontSize: '12px', color: '#9494AC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{replyTo.content || '[Mídia]'}</div>
                  </div>
                  <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9494AC', padding: '4px' }}><CloseIcon /></button>
                </div>
              )}

              {/* Mention suggestions */}
              {showMentions && filteredMentions.length > 0 && (
                <div style={{ borderTop: '1px solid rgba(148,148,172,0.08)', background: '#141420', maxHeight: '200px', overflowY: 'auto' }}>
                  {filteredMentions.map((m, i) => (
                    <button key={m.id} onClick={() => insertMention(m)} style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 16px', background: i === mentionIndex ? 'rgba(255,107,53,0.08)' : 'transparent',
                      border: 'none', cursor: 'pointer', textAlign: 'left',
                    }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg, #FF6B35, #E05520)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '12px', flexShrink: 0 }}>{m.displayName[0].toUpperCase()}</div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#F0F0F8' }}>{m.displayName}</div>
                        <div style={{ fontSize: '11px', color: '#5C5C72' }}>@{m.username}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Emoji picker */}
              {showEmojis && (
                <div style={{
                  borderTop: '1px solid rgba(148,148,172,0.08)', background: '#141420',
                  padding: '12px 16px', display: 'flex', flexWrap: 'wrap', gap: '4px',
                }}>
                  {QUICK_EMOJIS.map(e => (
                    <button key={e} onClick={() => { setNewMessage(prev => prev + e); inputRef.current?.focus(); }} style={{
                      width: '36px', height: '36px', borderRadius: '8px', border: 'none', background: 'transparent',
                      fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background 150ms',
                    }} onMouseEnter={ev => (ev.currentTarget.style.background = 'rgba(148,148,172,0.1)')} onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}>{e}</button>
                  ))}
                </div>
              )}

              {/* Input area */}
              <div style={{
                padding: '10px 16px', borderTop: '1px solid rgba(148,148,172,0.08)',
                display: 'flex', gap: '8px', alignItems: 'center',
              }}>
                {/* Recording indicator */}
                {isRecording ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', padding: '0 8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FF4D6A', animation: 'pulse 1s ease infinite' }} />
                    <span style={{ fontSize: '14px', color: '#FF4D6A', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatRecordTime(recordTime)}</span>
                    <div style={{ flex: 1 }} />
                    <button onClick={cancelRecording} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9494AC', padding: '8px' }}><CloseIcon /></button>
                    <button onClick={stopRecording} style={{
                      width: '40px', height: '40px', borderRadius: '50%', border: 'none',
                      background: '#FF6B35', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#0A0A0F',
                    }}><SendIcon /></button>
                  </div>
                ) : (
                  <>
                    {/* Emoji toggle */}
                    <button onClick={() => setShowEmojis(!showEmojis)} style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: '4px', fontSize: '20px', lineHeight: 1,
                      color: showEmojis ? '#FF6B35' : '#9494AC',
                    }}>😊</button>

                    {/* Attachment buttons */}
                    <button onClick={() => imageInputRef.current?.click()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}><ImageIcon /></button>
                    <button onClick={() => fileInputRef.current?.click()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}><PaperclipIcon /></button>
                    <input ref={imageInputRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadAndSend(f, f.type.startsWith('video/') ? 'VIDEO' : 'IMAGE'); e.target.value = ''; }} />
                    <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadAndSend(f, f.type.startsWith('audio/') ? 'AUDIO' : f.type.startsWith('image/') ? 'IMAGE' : f.type.startsWith('video/') ? 'VIDEO' : 'TEXT'); e.target.value = ''; }} />

                    {/* Text input */}
                    <input
                      ref={inputRef}
                      type="text"
                      value={newMessage}
                      onChange={e => handleInputChange(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={activeChatType === 'GROUP' ? 'Mensagem... (use @ para mencionar)' : 'Mensagem...'}
                      style={{
                        flex: 1, padding: '10px 16px', borderRadius: '24px',
                        background: '#141420', border: '1px solid rgba(148,148,172,0.08)',
                        color: '#F0F0F8', fontSize: '14px', outline: 'none',
                      }}
                    />

                    {/* Send or Mic */}
                    {newMessage.trim() ? (
                      <button onClick={sendMessage} disabled={sending} style={{
                        width: '40px', height: '40px', borderRadius: '50%', border: 'none',
                        background: '#FF6B35', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', flexShrink: 0, transition: 'background 200ms',
                      }}><SendIcon /></button>
                    ) : (
                      <button onClick={startRecording} style={{
                        width: '40px', height: '40px', borderRadius: '50%', border: 'none',
                        background: '#1A1A28', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', flexShrink: 0,
                      }}><MicIcon /></button>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ===== CREATE GROUP MODAL ===== */}
      {showCreateGroup && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(10,10,15,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#141420', borderRadius: '20px', border: '1px solid rgba(148,148,172,0.12)', padding: '24px', maxWidth: '420px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#F0F0F8', margin: '0 0 20px' }}>Criar Grupo</h2>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#5C5C72', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Nome do grupo</label>
            <input type="text" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="Ex: Treino da Galera" maxLength={50} style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', background: '#1A1A28', border: '1px solid rgba(148,148,172,0.12)', color: '#F0F0F8', fontSize: '15px', outline: 'none', marginBottom: '16px', boxSizing: 'border-box' }} />
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#5C5C72', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Adicionar membros</label>
            <input type="text" value={searchMember} onChange={e => searchUsers(e.target.value)} placeholder="Buscar por username..." style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', background: '#1A1A28', border: '1px solid rgba(148,148,172,0.12)', color: '#F0F0F8', fontSize: '14px', outline: 'none', marginBottom: '8px', boxSizing: 'border-box' }} />
            {searchResults.length > 0 && (
              <div style={{ background: '#1A1A28', borderRadius: '10px', marginBottom: '12px', overflow: 'hidden' }}>
                {searchResults.slice(0, 5).map(u => (
                  <button key={u.id} onClick={() => { setSelectedMembers(prev => [...prev, u]); setSearchResults(prev => prev.filter(r => r.id !== u.id)); setSearchMember(''); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(148,148,172,0.06)', cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #FF6B35, #E05520)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>{u.displayName[0].toUpperCase()}</div>
                    <div><div style={{ fontSize: '13px', fontWeight: 600, color: '#F0F0F8' }}>{u.displayName}</div><div style={{ fontSize: '11px', color: '#5C5C72' }}>@{u.username}</div></div>
                  </button>
                ))}
              </div>
            )}
            {selectedMembers.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                {selectedMembers.map(m => (
                  <span key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', background: 'rgba(255,107,53,0.1)', color: '#FF8050', fontSize: '12px', fontWeight: 600 }}>
                    @{m.username}
                    <button onClick={() => setSelectedMembers(prev => prev.filter(x => x.id !== m.id))} style={{ background: 'none', border: 'none', color: '#FF4D6A', cursor: 'pointer', fontSize: '14px', padding: 0, lineHeight: 1 }}>&times;</button>
                  </span>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setShowCreateGroup(false); setNewGroupName(''); setSelectedMembers([]); setSearchMember(''); }} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid rgba(148,148,172,0.12)', background: 'transparent', color: '#9494AC', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={createGroup} disabled={!newGroupName.trim() || creating} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: newGroupName.trim() ? '#FF6B35' : '#1A1A28', color: newGroupName.trim() ? '#0A0A0F' : '#5C5C72', fontSize: '14px', fontWeight: 700, cursor: newGroupName.trim() ? 'pointer' : 'default' }}>{creating ? 'Criando...' : 'Criar Grupo'}</button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .fire-read {
          animation: fireGlow 1.5s ease infinite;
        }
        @keyframes fireGlow {
          0%, 100% { filter: drop-shadow(0 0 3px rgba(255,107,53,0.4)); transform: scale(1); }
          50% { filter: drop-shadow(0 0 8px rgba(255,107,53,0.8)); transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}

const ctxBtnStyle: React.CSSProperties = {
  width: '100%', padding: '12px 16px', background: 'none', border: 'none',
  color: '#F0F0F8', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
  textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px',
  borderBottom: '1px solid rgba(148,148,172,0.06)',
};
