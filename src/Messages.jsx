import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';

function Messages({ session, onClose }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
  messagesEndRef.current?.scrollIntoView({
    behavior: 'smooth'
  });
}, [messages]);

  useEffect(() => {
  async function fetchConversations() {
    const { data, error } = await supabase
      .from('conversations')
      .select('*, items(item_name), messages(message, created_at, sender_id)')
      .or(`reporter_id.eq.${session.user.id},contact_id.eq.${session.user.id}`)
      .order('created_at', { ascending: false })
      .order('created_at', {
        referencedTable: 'messages',
        ascending: false
      });

    if (error) {
      console.error('Error fetching conversations:', error);
      setLoading(false);
      return;
    }

    const { data: readStatuses, error: readError } = await supabase
      .from('conversation_reads')
      .select('conversation_id, last_read_at')
      .eq('user_id', session.user.id);

    if (readError) {
      console.error('Error fetching read statuses:', readError);
      setLoading(false);
      return;
    }

    const participantIds = [
  ...new Set(
    data.map((conversation) =>
      conversation.reporter_id === session.user.id
        ? conversation.contact_id
        : conversation.reporter_id
    )
  )
];

const { data: profiles, error: profilesError } = await supabase
  .from('profiles')
  .select('id, full_name')
  .in('id', participantIds);

if (profilesError) {
  console.error('Error fetching profiles:', profilesError);
}

const updatedConversations = data.map((conversation) => {
  const otherUserId =
    conversation.reporter_id === session.user.id
      ? conversation.contact_id
      : conversation.reporter_id;

  const otherProfile = profiles?.find(
    (profile) => profile.id === otherUserId
  );

  const readStatus = readStatuses.find(
    (read) => read.conversation_id === conversation.id
  );

  return {
    ...conversation,
    other_user_name: otherProfile?.full_name || 'Other user',
    last_read_at: readStatus?.last_read_at || null
  };
});

    setConversations(updatedConversations);
    setLoading(false);
  }

  fetchConversations();
}, [session]);

  useEffect(() => {
  if (!selectedConversation) return;

  let ignore = false;

  async function fetchMessages() {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', selectedConversation.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    if (!ignore) {
      setMessages(data);

      const { error: readError } = await supabase
        .from('conversation_reads')
        .upsert({
          conversation_id: selectedConversation.id,
          user_id: session.user.id,
          last_read_at: new Date().toISOString()
        }, {
          onConflict: 'conversation_id,user_id'
        });

      if (readError) {
        console.error('Error updating read status:', readError);
      }
    }
  }

  const channel = supabase
    .channel(`chat-${selectedConversation.id}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${selectedConversation.id}`
      },
      (payload) => {
        setMessages((previousMessages) => {
          if (previousMessages.some((msg) => msg.id === payload.new.id)) {
            return previousMessages;
          }

          return [...previousMessages, payload.new];
        });
      }
    )
    .subscribe();

  fetchMessages();

  return () => {
    ignore = true;
    supabase.removeChannel(channel);
  };
}, [selectedConversation, session]);
async function handleSendMessage(e) {
  e.preventDefault();

  const newMessage = messageText.trim();

  if (!newMessage || !selectedConversation) return;

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: selectedConversation.id,
      sender_id: session.user.id,
      message: newMessage
    })
    .select()
    .single();

  if (error) {
    console.error('Error sending message:', error);
    alert('Unable to send message.');
    return;
  }

  setMessages((previousMessages) => [...previousMessages, data]);
  setMessageText('');
}
  return (
  <div className="messages-container">
    {selectedConversation ? (
      <>
        <div className="chat-header">
  <button
    className="chat-back-button"
    onClick={() => setSelectedConversation(null)}
  >
    ←
  </button>

  <div className="chat-header-info">
    <h2>
      {selectedConversation.other_user_name || 'Other user'}
    </h2>
    <small>iBUFind Messages</small>
  </div>
</div>

       <div className="chat-messages">
  {messages.length === 0 ? (
    <p>No messages yet. Start the conversation!</p>
  ) : (
    messages.map((message) => (
      <div
        key={message.id}
        className={
          message.sender_id === session.user.id
            ? 'message-bubble sent'
            : 'message-bubble received'
        }
      >
        <small className="message-sender">
          {message.sender_id === session.user.id
            ? 'You'
            : selectedConversation.other_user_name}
        </small>

        <p>{message.message}</p>

        <small className="message-time">
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit'
          })}
        </small>
      </div>
    ))
  )}

  <div ref={messagesEndRef} />
</div>
<form onSubmit={handleSendMessage} className="chat-input">
  <input
    type="text"
    placeholder="Aa"
    value={messageText}
    onChange={(e) => setMessageText(e.target.value)}
  />

  <button type="submit" disabled={!messageText.trim()}>
    Send
  </button>
</form>
      </>
    ) : (
      <>
        <h2>My Messages</h2>

        <button onClick={onClose}>Back to Homepage</button>

        {loading ? (
          <p>Loading conversations...</p>
        ) : conversations.length === 0 ? (
          <p>No messages yet.</p>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              className="conversation-item"
              onClick={() => setSelectedConversation(conversation)}
              style={{ cursor: 'pointer' }}
            >
              <p>{conversation.items?.item_name || 'Item conversation'}</p>

<p className="last-message-preview">
  {conversation.messages?.[0]
    ? `${conversation.messages[0].sender_id === session.user.id
        ? 'You: '
        : `${conversation.other_user_name}: `}${conversation.messages[0].message}`
    : 'No messages yet'}
</p>

{conversation.messages?.[0] &&
  conversation.messages[0].sender_id !== session.user.id &&
  (!conversation.last_read_at ||
    new Date(conversation.messages[0].created_at) >
    new Date(conversation.last_read_at)) && (
      <span className="unread-badge">NEW</span>
)}
            </div>
          ))
        )}
      </>
    )}
  </div>
);
}

export default Messages;