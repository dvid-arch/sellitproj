
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Plus, Search, MapPin, Bell, MessageSquare, Home,
  ChevronDown, Filter, PackageX, LogOut, PanelLeftClose, PanelLeftOpen,
  ArrowUpDown, Radio, UserCircle, Settings, Heart, TrendingUp, Sparkles, Tag,
  ArrowRight, Bot, ShieldQuestion, Clock, Zap, RefreshCw, AlertCircle
} from 'lucide-react';
import { Logo } from '../appConstants.tsx';
import { User, Listing, Chat, Offer, ViewRecord, Notification, Broadcast, ListingStatus } from '../types.ts';
import { ListingForm } from './ListingForm.tsx';
import { ProductDetail } from './ProductDetail.tsx';
import { BroadcastForm } from './BroadcastForm.tsx';
import { BroadcastsView } from './BroadcastsView.tsx';
import { ChatView } from './ChatView.tsx';
import { NotificationsView } from './NotificationsView.tsx';
import { ProfileView } from './ProfileView.tsx';
import { AIAssistant } from './AIAssistant.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { geminiService } from '../services/gemini.ts';
import { storageService } from '../services/storageService.ts';
import { SEED_SUPPORT_CHAT } from '../data/seedData.ts';
import { AuthRequiredModal } from './AuthRequiredModal.tsx';
import { PublicationSuccess } from './PublicationSuccess.tsx';
import { useNavigate, useLocation, useParams } from 'react-router-dom';

interface DashboardProps {
  user: User | null;
  onLogout: () => void;
  onUpdateUser: (user: User) => void;
}

const SUPPORT_CHAT_ID = 'chat_support';

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, onUpdateUser }) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [allOffers, setAllOffers] = useState<Offer[]>([]);
  const [savedItems, setSavedItems] = useState<string[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [viewHistory, setViewHistory] = useState<ViewRecord[]>([]);

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [showBroadcastForm, setShowBroadcastForm] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [profileTab, setProfileTab] = useState<'listings' | 'offers' | 'history' | 'settings'>('listings');

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [sortBy, setSortBy] = useState('Newest');

  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [authModal, setAuthModal] = useState<{ open: boolean, action: string }>({ open: false, action: '' });
  const [successModal, setSuccessModal] = useState<{ open: boolean, title: string, isUpdate: boolean, listing?: Listing }>({ open: false, title: '', isUpdate: false });

  const navigate = useNavigate();
  const location = useLocation();
  const { id: deepLinkId } = useParams();

  // Map path to tab name
  const pathToTab: Record<string, string> = {
    '/': 'Home',
    '/broadcasts': 'Broadcasts',
    '/add': 'Add Product',
    '/notifications': 'Notifications',
    '/messages': 'Messages',
    '/profile': 'Profile'
  };

  const activeTab = pathToTab[location.pathname] || 'Home';
  const setActiveTab = (tab: string) => {
    const tabToPath: Record<string, string> = {
      'Home': '/',
      'Broadcasts': '/broadcasts',
      'Add Product': '/add',
      'Notifications': '/notifications',
      'Messages': '/messages',
      'Profile': '/profile'
    };
    navigate(tabToPath[tab] || '/');
  };
  const { showToast } = useToast();
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const productGridRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const categories = useMemo(() => ['All Categories', 'Electronics', 'Books', 'Fashion', 'Kitchen', 'Home and furniture'], []);
  const sortOptions = useMemo(() => ['Newest', 'Price: Low to High', 'Price: High to Low', 'Urgent First'], []);

  const recentlyViewedItems = useMemo(() => {
    return viewHistory
      .sort((a, b) => b.timestamp - a.timestamp)
      .map(v => listings.find(l => l.id === v.listingId))
      .filter((l): l is Listing => !!l)
      .slice(0, 8);
  }, [viewHistory, listings]);

  const filteredListings = useMemo(() => {
    let result = [...listings];
    if (selectedCategory !== 'All Categories') {
      result = result.filter(l => l.category === selectedCategory);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(l =>
        l.title.toLowerCase().includes(query) ||
        l.description.toLowerCase().includes(query)
      );
    }

    const sorted = [...result];
    if (sortBy === 'Price: Low to High') {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'Price: High to Low') {
      sorted.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'Urgent First') {
      sorted.sort((a, b) => (b.isUrgent ? -1 : 1) - (a.isUrgent ? -1 : 1));
    } else {
      sorted.sort((a, b) => {
        if (a.isBoosted && !b.isBoosted) return -1;
        if (!a.isBoosted && b.isBoosted) return 1;
        return (b.id || '').localeCompare(a.id || '');
      });
    }
    return sorted;
  }, [listings, selectedCategory, searchQuery, sortBy]);

  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const suggestions: { label: string; type: 'category' | 'listing' | 'ai' | 'trending'; extra?: string }[] = [];

    const categoryMatches = categories.filter(c =>
      c !== 'All Categories' && c.toLowerCase().includes(searchQuery.toLowerCase())
    );
    categoryMatches.forEach(c => suggestions.push({ label: c, type: 'category' }));

    const listingMatches = listings.filter(l =>
      l.title.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 3);
    listingMatches.forEach(l => suggestions.push({ label: l.title, type: 'listing', extra: `₦${l.price.toLocaleString()}` }));

    if (searchQuery.length > 2) {
      suggestions.push({ label: `Ask AI: "${searchQuery}"`, type: 'ai' });
    }

    return suggestions;
  }, [searchQuery, listings, categories]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      if (user) {
        const [listingsData, broadcastsData, chatsData, offersData, savedListData, notificationsData] = await Promise.all([
          storageService.getListings(),
          storageService.getBroadcasts(),
          storageService.getChats(),
          storageService.getOffers(),
          storageService.getSavedListings(),
          storageService.getNotifications()
        ]);

        setListings(listingsData.map((l: any) => ({ ...l, id: l._id || l.id })));
        setBroadcasts(broadcastsData.map((b: any) => ({ ...b, id: b._id || b.id })));
        const formattedChats = chatsData.map((c: any) => {
          // Flatten standard chat
          const other = c.participants?.find((p: any) => p._id !== user.id) || c.participants?.[0];
          return {
            ...c,
            id: c._id || c.id,
            contactName: c.contactName || other?.name || 'Unknown User',
            contactAvatar: c.contactAvatar || other?.avatar || 'https://via.placeholder.com/150'
          };
        });
        const combinedChats = [
          SEED_SUPPORT_CHAT,
          ...formattedChats.filter((c: any) => c.id !== SEED_SUPPORT_CHAT.id)
        ];

        // Ensure support chat is updated if it exists in response
        const finalSupport = formattedChats.find((c: any) => c.id === SEED_SUPPORT_CHAT.id);
        if (finalSupport) {
          combinedChats[0] = { ...SEED_SUPPORT_CHAT, ...finalSupport };
        }

        setChats(combinedChats);
        setAllOffers(offersData.map((o: any) => ({ ...o, id: o._id || o.id })));
        setSavedItems(savedListData);
        setNotifications(notificationsData.map((n: any) => ({ ...n, id: n._id || n.id })));
      } else {
        // Guest mode: only load public data
        const [listingsData, broadcastsData] = await Promise.all([
          storageService.getListings(),
          storageService.getBroadcasts()
        ]);
        setListings(listingsData.map((l: any) => ({ ...l, id: l._id || l.id })));
        setBroadcasts(broadcastsData.map((b: any) => ({ ...b, id: b._id || b.id })));
        setChats([SEED_SUPPORT_CHAT]);
        setAllOffers([]);
        setSavedItems([]);
        setNotifications([]);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load data:', error);
      setLoadError(true);
      setIsLoading(false);
      setListings([]);
      setBroadcasts([]);
      setChats([SEED_SUPPORT_CHAT]);
    }
  }, [user]);

  useEffect(() => {
    const sidebarTimer = setTimeout(() => setIsSidebarExpanded(false), 1500);
    loadData();
    return () => clearTimeout(sidebarTimer);
  }, [loadData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (deepLinkId && listings.length > 0) {
      const listing = listings.find(l => l.id === deepLinkId);
      if (listing) {
        setSelectedListing(listing);
      }
    } else if (!deepLinkId && selectedListing) {
      // Only clear if we're not explicitly on a product page
      if (!location.pathname.includes('/product/')) {
        setSelectedListing(null);
      }
    }
  }, [deepLinkId, listings, location.pathname]);

  const scrollToGrid = useCallback(() => {
    if (productGridRef.current) {
      const offset = 80;
      const elementPosition = productGridRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + (scrollContainerRef.current?.scrollTop || 0) - offset;

      scrollContainerRef.current?.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    setIsScrolled(e.currentTarget.scrollTop > 100);
  };

  const handleOpenProduct = (listing: Listing) => {
    setSelectedListing(listing);
    navigate(`/product/${listing.id}`);
    setViewHistory(prev => {
      const exists = prev.find(v => v.listingId === listing.id);
      if (exists) {
        return prev.map(v => v.listingId === listing.id ? { ...v, timestamp: Date.now() } : v);
      }
      return [{ listingId: listing.id, lastViewedPrice: listing.price, timestamp: Date.now() }, ...prev];
    });
  };

  const toggleSave = async (id: string) => {
    try {
      await storageService.toggleSavedListing(id);
      const updated = await storageService.getSavedListings();
      setSavedItems(updated);
      showToast(updated.includes(id) ? 'Saved' : 'Removed', 'Listing updated in your favorites.', 'info');
    } catch (err) {
      showToast('Error', 'Failed to update saved list.', 'error');
    }
  };

  const startChatAction = useCallback(async (participantId: string, contactName: string, avatar: string, product?: { listingId?: string, title: string, price: number, imageUrl: string, status?: ListingStatus }) => {
    if (!user) {
      setAuthModal({ open: true, action: 'start a chat' });
      return;
    }
    try {
      const chat = await storageService.startChat(participantId, false, product);
      const newChat = {
        ...chat,
        id: (chat as any)._id || chat.id,
        contactName: contactName,
        contactAvatar: avatar,
        messages: chat.messages || [],
        product: product || chat.product
      };

      setChats(prev => {
        const existing = prev.find(c => c.id === newChat.id);
        if (existing) {
          return prev.map(c => c.id === newChat.id ? { ...c, product: newChat.product } : c);
        }
        return [newChat, ...prev];
      });
      setActiveChatId(newChat.id);
      setActiveTab('Messages');
    } catch (err) {
      showToast('Error', 'Failed to start chat.', 'error');
    }
  }, [user, showToast, onLogout, setActiveTab]);

  const handleAcceptOffer = useCallback(async (offer: Offer) => {
    try {
      await storageService.updateOfferStatus(offer.id, 'accepted');
      setAllOffers(prev => prev.map(o => o.id === offer.id ? { ...o, status: 'accepted' } : o));

      // Refresh listings to show 'committed'
      const updatedListings = await storageService.getListings();
      setListings(updatedListings.map((l: any) => ({ ...l, id: l._id || l.id })));

      showToast('Offer Accepted', 'Starting negotiation chat.', 'success');
      
      // Auto-start chat after accepting offer
      const listing = updatedListings.find((l: any) => (l._id || l.id) === offer.listingId);
      if (listing) {
        const otherId = offer.buyerName === user?.name ? (listing.seller as any)._id || listing.seller : offer.buyerName; // This logic is approximate for now
        // We know the other party is the buyer
        const buyerId = (offer as any).buyer?._id || (offer as any).buyer;
        await startChatAction(buyerId, offer.buyerName, offer.buyerAvatar, {
          listingId: listing.id,
          title: listing.title,
          price: offer.offeredPrice,
          imageUrl: listing.imageUrl,
          status: 'committed'
        });
        
        // System message in chat
        const chat = chats.find(c => c.product?.listingId === listing.id);
        if (chat) {
          await storageService.addMessage(chat.id, `🤝 **Offer Accepted**: ₦${offer.offeredPrice.toLocaleString()} for ${listing.title}.`);
        }
      }
    } catch (err) {
      showToast('Error', 'Failed to accept offer.', 'error');
    }
  }, [showToast, user, startChatAction, chats]);

  const handleCounterOffer = useCallback(async (offer: Offer, newPrice: number) => {
    try {
      await storageService.updateOfferStatus(offer.id, 'countered', newPrice);
      setAllOffers(prev => prev.map(o => o.id === offer.id ? { ...o, status: 'countered', offeredPrice: newPrice } : o));
      
      showToast('Counter Sent', `Suggested ₦${newPrice.toLocaleString()}`, 'success');
      
      // Post to chat if exists
      const chat = chats.find(c => c.product?.listingId === offer.listingId);
      if (chat) {
        await storageService.addMessage(chat.id, `💰 **Counter Offer**: ₦${newPrice.toLocaleString()} suggested for ${offer.listingTitle}.`);
      }
    } catch (err) {
      showToast('Error', 'Failed to send counter offer.', 'error');
    }
  }, [showToast, chats]);

  const handleWithdrawOffer = useCallback(async (offerId: string) => {
    try {
      await storageService.withdrawOffer(offerId);
      setAllOffers(prev => prev.filter(o => o.id !== offerId));
      showToast('Offer Withdrawn', 'Your offer has been removed.', 'info');
    } catch (err) {
      showToast('Error', 'Failed to withdraw offer.', 'error');
    }
  }, [showToast]);

  const handleCommitToBuy = useCallback(async (listingId: string, amount: number) => {
    if (!user) {
      setAuthModal({ open: true, action: 'commit to buy' });
      return;
    }
    try {
      const updatedListing = await storageService.commitToBuy(listingId);
      setListings(prev => prev.map(l => l.id === listingId ? { ...l, status: 'committed' } : l));
      
      showToast('Success!', 'Item secured in escrow.', 'success');
      
      // Start chat with seller
      const sellerId = (updatedListing.seller as any)._id || updatedListing.seller;
      const sellerName = (updatedListing.seller as any).name || 'Seller';
      const sellerAvatar = (updatedListing.seller as any).avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150';
      
      await startChatAction(sellerId, sellerName, sellerAvatar, {
        listingId: updatedListing.id,
        title: updatedListing.title,
        price: updatedListing.price,
        imageUrl: updatedListing.imageUrl,
        status: 'committed'
      });
      
      // System message
      const chat = await storageService.startChat(sellerId, false, { listingId }); // Re-fetch or use local
      await storageService.addMessage(chat.id, `🔒 **Commit to Buy**: I've secured the funds in escrow for ₦${updatedListing.price.toLocaleString()}. (I will share my release code with you once I've inspected the item).`);
      
    } catch (err) {
      showToast('Error', 'Failed to commit to purchase.', 'error');
    }
  }, [user, showToast, startChatAction]);

  const handleSwitchToSupport = () => {
    setIsAssistantOpen(false);
    setActiveChatId(SUPPORT_CHAT_ID);
    setActiveTab('Messages');
    showToast('Connecting to Support', 'A human agent will be with you in ~3 mins.', 'info');
  };

  const handleNotificationAction = (payload: any) => {
    switch (payload.type) {
      case 'view_listing':
        const listing = listings.find(l => l.id === payload.id);
        if (listing) {
          handleOpenProduct(listing);
        } else {
          // Fallback: fetch from backend if not in local state
          storageService.getListing(payload.id).then(fetched => {
            const mapped = { ...fetched, id: (fetched as any)._id || fetched.id };
            handleOpenProduct(mapped);
          }).catch(() => {
            showToast('Expired', 'This listing is no longer available.', 'info');
          });
        }
        break;
      case 'view_offer':
        setProfileTab('offers');
        setActiveTab('Profile');
        break;
      case 'view_transaction':
        setProfileTab('history');
        setActiveTab('Profile');
        break;
      case 'navigate_tab':
        if (payload.tab === 'Profile') setProfileTab('listings');
        setActiveTab(payload.tab);
        if (payload.tab === 'Home') scrollToGrid();
        break;
      case 'payment_received':
        showToast('Payment Alert', payload.message, 'success');
        setActiveTab('Profile');
        break;
      case 'offer_accepted':
        showToast('Offer Accepted!', payload.message, 'success');
        setActiveTab('Messages');
        break;
      case 'counter_received':
        showToast('New Counter Offer', payload.message, 'info');
        setActiveTab('Messages');
        break;
      default:
        console.warn('Unhandled notification action', payload);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await storageService.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) { }
  };

  const handleSeedNotifications = async () => {
    try {
      await storageService.seedNotifications();
      const updated = await storageService.getNotifications();
      setNotifications(updated.map((n: any) => ({ ...n, id: n._id || n.id })));
    } catch (err) {
      showToast('Error', 'Failed to seed notifications.', 'error');
    }
  };

  const handleSelectSuggestion = (suggestion: any) => {
    if (suggestion.type === 'category') {
      setSelectedCategory(suggestion.label);
      setSearchQuery('');
    } else if (suggestion.type === 'listing') {
      setSearchQuery(suggestion.label);
    } else if (suggestion.type === 'ai') {
      setIsAssistantOpen(true);
    }
    setShowSearchSuggestions(false);
  };

  const handleNewBroadcast = async (data: any) => {
    if (!user) {
      setAuthModal({ open: true, action: 'post a broadcast' });
      return;
    }
    try {
      const newBroadcast = await storageService.addBroadcast({
        ...data,
        author: user?.name || 'Student',
        authorId: user?.id,
        authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        time: new Date().toISOString()
      });
      setBroadcasts(prev => [newBroadcast, ...prev]);
      showToast('Broadcast Sent', 'Nearby students will see your request.', 'success');
    } catch (err) {
      showToast('Error', 'Failed to send broadcast.', 'error');
    }
  };

  const navItems = [
    { name: 'Home', icon: Home },
    { name: 'Broadcasts', icon: Radio },
    { name: 'Add Product', icon: Plus, isPrimary: true },
    { name: 'Notifications', icon: Bell, count: notifications.filter(n => !n.isRead).length },
    { name: 'Messages', icon: MessageSquare },
  ];

  const renderContent = () => {
    if (showBroadcastForm) return <div className="p-4 md:p-8 overflow-y-auto h-full"><BroadcastForm onBack={() => setShowBroadcastForm(false)} onSubmit={handleNewBroadcast} /></div>;

    // Edit Listing Flow
    if (editingListing) {
      return <div className="overflow-y-auto h-full"><ListingForm
        initialData={editingListing}
        onClose={() => setEditingListing(null)}
        onSubmit={async (l) => {
          try {
            await storageService.updateListing(editingListing.id, l);
            await loadData();
            setSuccessModal({ open: true, title: l.title, isUpdate: true, listing: { ...editingListing, ...l } });
            setEditingListing(null);
            showToast('Updated!', 'Listing updated successfully.', 'success');
          } catch (err: any) {
            console.error('Failed to update listing:', err);
            const msg = err.response?.data?.message || err.message || 'Check your internet connection or image size.';
            showToast('Update Failed', msg, 'error');
          }
        }}
      /></div>;
    }

    switch (activeTab) {
      case 'Broadcasts':
        return <div className="p-4 md:p-8 overflow-y-auto h-full"><BroadcastsView broadcasts={broadcasts} currentUserId={user?.id} onDelete={async (id) => {
          try {
            await storageService.deleteBroadcast(id);
            setBroadcasts(prev => prev.filter(b => b.id !== id));
            showToast('Broadcast Removed', 'Your request has been deleted.', 'success');
          } catch (err) {
            showToast('Error', 'Failed to remove broadcast.', 'error');
          }
        }} onRespond={(b) => startChatAction(b.authorId || b.author, b.author, b.authorAvatar, { title: `Ref: ${b.need}`, price: b.budgetMax, imageUrl: b.authorAvatar })} onAddClick={() => setShowBroadcastForm(true)} /></div>;
      case 'Add Product':
        return <div className="overflow-y-auto h-full"><ListingForm onClose={() => navigate('/')} onSubmit={async (l) => {
          try {
            const newListing = await storageService.addListing(l);
            await loadData();
            setSuccessModal({ open: true, title: l.title, isUpdate: false, listing: newListing });
            navigate('/');
            showToast('Published!', 'Your product is now live on Sellit.', 'success');
          } catch (err: any) {
            console.error('Failed to add listing:', err);
            const msg = err.response?.data?.message || err.message || 'Check your internet connection or image size.';
            showToast('Publish Failed', msg, 'error');
          }
        }} /></div>;
      case 'Notifications':
        return (
          <div className="overflow-y-auto h-full">
            <NotificationsView
              notifications={notifications}
              onAction={handleNotificationAction}
              onMarkRead={handleMarkRead}
              onMarkAllRead={() => setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))}
              onDelete={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
              onClearAll={() => setNotifications([])}
              onSeed={handleSeedNotifications}
            />
          </div>
        );
      case 'Messages':
        return <div className="h-full"><ChatView chats={chats} activeChatId={activeChatId} currentUser={user} onSelectChat={setActiveChatId} onSendMessage={async (chatId, text) => {
          try {
            const updatedChat = await storageService.addMessage(chatId, text);
            setChats(prev => prev.map(c => {
              if (c.id === chatId) {
                // Return original UI object with updated messages/lastMessage from backend
                return {
                  ...c,
                  messages: updatedChat.messages || [],
                  lastMessage: updatedChat.lastMessage,
                  lastMessageTime: updatedChat.lastMessageTime
                };
              }
              return c;
            }));
          } catch (err) {
            console.error('Failed to send message:', err);
            showToast('Error', 'Failed to send message.', 'error');
          }
        }} /></div>;
      case 'Profile':
        return <div className="overflow-y-auto h-full"><ProfileView
          user={user as any}
          listings={listings.filter(l => l.seller === (user?.name || 'Obokobong'))}
          offers={allOffers}
          onOpenListing={handleOpenProduct}
            onAcceptOffer={handleAcceptOffer}
            onCounterOffer={handleCounterOffer}
            onWithdrawOffer={handleWithdrawOffer}
            initialTab={profileTab}
            onEditListing={(l) => setEditingListing(l)}
          onDeleteListing={async (id) => {
            try {
              await storageService.deleteListing(id);
              setListings(prev => prev.filter(l => l.id !== id));
              showToast('Deleted', 'Listing removed successfully.', 'success');
            } catch (err) {
              showToast('Error', 'Failed to delete listing.', 'error');
            }
          }}
          onMarkSold={async (id) => {
            try {
              await storageService.updateListing(id, { status: 'sold' });
              setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'sold' } : l));
              showToast('Marked as Sold', 'Listing status updated.', 'success');
            } catch (err) {
              showToast('Error', 'Failed to update listing.', 'error');
            }
          }}
          onBoostListing={async (id) => {
            try {
              await storageService.updateListing(id, { isBoosted: true });
              setListings(prev => prev.map(l => l.id === id ? { ...l, isBoosted: true } : l));
              showToast('Boosted!', 'Your listing is now featured.', 'success');
            } catch (err) {
              showToast('Error', 'Failed to boost listing.', 'error');
            }
          }}
          onAddProductClick={() => setActiveTab('Add Product')}
          onUpdateUser={onUpdateUser}
        /></div>;
      default:
        return (
          <div className="p-4 md:p-10 space-y-10">
            {/* Marketplace Hero */}
            <div className="relative overflow-hidden bg-sellit rounded-[2.5rem] p-8 md:p-14 text-white">
              <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
                <Sparkles size={400} />
              </div>
              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                  <Zap size={14} className="text-yellow-400 fill-yellow-400" />
                  Flash Deals Live
                </div>
                <h1 className="text-4xl md:text-6xl font-black mb-6 leading-[1.1]">The Campus <br /> marketplace <span className="text-white/40 italic">evolved.</span></h1>
                <p className="text-white/70 text-lg font-medium mb-10 max-w-md">Buy, sell, and trade safely within your university community. Zero commissions, pure campus vibes.</p>
                <div className="flex flex-wrap gap-4">
                  <button onClick={() => {
                    if (!user) {
                      setAuthModal({ open: true, action: 'list an item' });
                      return;
                    }
                    setActiveTab('Add Product');
                  }} className="bg-white text-sellit px-8 py-4 rounded-2xl font-black text-lg hover:scale-105 active:scale-95 transition-all shadow-2xl flex items-center gap-2 shadow-sellit/20">
                    <Plus size={20} /> List Item
                  </button>
                  <button onClick={scrollToGrid} className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-2xl font-black text-lg hover:bg-white/20 transition-all flex items-center gap-2">
                    Browse All <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Product Grid Section */}
            <div ref={productGridRef} className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <TrendingUp className="text-sellit" size={24} />
                    Most Recent Ads
                  </h2>
                  <p className="text-gray-400 font-bold text-sm">Updated 2 minutes ago</p>
                </div>
                <div className="hidden md:flex items-center gap-2 p-1.5 bg-gray-100 rounded-2xl">
                  {sortOptions.map(opt => (
                    <button key={opt} onClick={() => setSortBy(opt)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tighter transition-all ${sortBy === opt ? 'bg-white text-sellit shadow-sm scale-105' : 'text-gray-400 hover:text-gray-600'}`}>{opt}</button>
                  ))}
                </div>
              </div>

              {filteredListings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-gray-100 italic font-medium text-gray-400">
                  <PackageX size={64} className="mb-4 opacity-50" />
                  <p className="text-xl">Nothing matches your filters</p>
                  <button onClick={() => { setSearchQuery(''); setSelectedCategory('All Categories'); }} className="mt-4 text-sellit font-black hover:underline">Clear all filters</button>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-10 pb-20 md:pb-12">
                  {filteredListings.map(item => (
                    <div key={item.id} onClick={() => handleOpenProduct(item)} className="group bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100 hover:shadow-2xl hover:shadow-sellit/5 hover:-translate-y-2 transition-all cursor-pointer relative overflow-hidden">
                      {item.isBoosted && <div className="absolute top-4 left-4 z-10 px-2.5 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-yellow-500/20"><Sparkles size={10} /> Premium</div>}
                      <div className="relative aspect-square rounded-[1.5rem] overflow-hidden mb-5">
                        <img src={item.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.title} />
                        <button onClick={(e) => { e.stopPropagation(); toggleSave(item.id || ''); }} className={`absolute top-3 right-3 p-3 rounded-2xl backdrop-blur-md transition-all active:scale-90 ${savedItems.includes(item.id || '') ? 'bg-sellit text-white shadow-lg' : 'bg-white/80 text-gray-400 hover:bg-white hover:text-sellit shadow-sm'}`}>
                          <Heart size={18} fill={savedItems.includes(item.id || '') ? "currentColor" : "none"} />
                        </button>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-bold text-gray-900 group-hover:text-sellit transition-colors truncate">{item.title}</h4>
                          <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg shrink-0">{item.category}</span>
                        </div>
                        <p className="text-gray-500 text-xs md:text-sm line-clamp-2 leading-relaxed min-h-[2.5rem]">{item.description}</p>
                        <div className="pt-3 flex items-end justify-between border-t border-gray-50 mt-2">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pricing</span>
                            <p className="text-xl md:text-2xl font-black text-sellit leading-none">₦{item.price.toLocaleString()}</p>
                          </div>
                          <div className="flex items-center gap-1.5 p-2 bg-sellit/5 rounded-xl group-hover:bg-sellit group-hover:text-white transition-all">
                            <ArrowRight size={16} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFB] overflow-hidden selection:bg-sellit/10 selection:text-sellit">
      {/* Responsive Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 md:static bg-white border-r border-gray-100 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-2xl md:shadow-none ${isSidebarExpanded ? 'w-72 translate-x-0' : 'w-24 md:translate-x-0 -translate-x-full'
        }`}>
        <div className="h-20 flex items-center justify-between px-7 shrink-0 border-b border-gray-50">
          <div className={`overflow-hidden transition-all duration-300 ${isSidebarExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 md:opacity-100 md:w-auto'}`}>
            <Logo />
          </div>
          <button onClick={() => setIsSidebarExpanded(!isSidebarExpanded)} className="hidden md:flex p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400">
            {isSidebarExpanded ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
          </button>
        </div>

        <nav className="flex-1 py-8 px-4 flex flex-col gap-2 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                if (!user && (item.name === 'Add Product' || item.name === 'Messages' || item.name === 'Notifications')) {
                  setAuthModal({ open: true, action: `access ${item.name}` });
                  return;
                }
                setActiveTab(item.name);
              }}
              className={`relative flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group ${activeTab === item.name
                ? 'bg-sellit text-white shadow-xl shadow-sellit/20'
                : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <div className={`shrink-0 ${activeTab === item.name ? 'scale-110' : 'group-hover:scale-110 transition-transform'}`}>
                <item.icon size={22} strokeWidth={activeTab === item.name ? 3 : 2} />
              </div>
              <span className={`font-black uppercase tracking-widest text-[10px] transition-all duration-500 whitespace-nowrap ${isSidebarExpanded ? 'opacity-100 translate-x-0' : 'hidden'
                }`}>
                {item.name}
              </span>
              {item.count ? (
                <span className={`absolute ${isSidebarExpanded ? 'right-4' : 'right-2 -top-1'} flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-black text-white border-2 border-white`}>
                  {item.count}
                </span>
              ) : null}
              {activeTab === item.name && !isSidebarExpanded && (
                <div className="absolute left-full ml-4 px-3 py-1 bg-gray-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-[100]">
                  {item.name}
                </div>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-50 mt-auto">
          <button onClick={onLogout} className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all group`}>
            <LogOut size={22} className="group-hover:rotate-12 transition-transform" />
            <span className={`font-black uppercase tracking-widest text-[10px] ${isSidebarExpanded ? 'block' : 'hidden'}`}>Logout Session</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Main Content Header */}
        <header className={`h-20 flex items-center justify-between px-6 md:px-10 z-40 bg-white border-b border-gray-100 transition-all duration-300`}>
          <div className="flex md:hidden mr-4">
            <button onClick={() => setIsSidebarExpanded(!isSidebarExpanded)} className="p-2 text-gray-400"><PanelLeftOpen size={24} /></button>
          </div>

          <div ref={searchRef} className="flex-1 max-w-xl relative group">
            <div className="relative">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${showSearchSuggestions ? 'text-sellit' : 'text-gray-400 group-hover:text-gray-600'}`} size={18} />
              <input
                type="text"
                className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-4 h-12 text-sm font-medium focus:ring-4 focus:ring-sellit/10 focus:bg-white transition-all"
                placeholder="Search campus ads, services, or ask AI..."
                value={searchQuery}
                onFocus={() => setShowSearchSuggestions(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {showSearchSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 p-2 z-50">
                {searchSuggestions.length > 0 ? (
                  <div className="space-y-1">
                    {searchSuggestions.map((suggestion, idx) => (
                      <button key={idx} onClick={() => handleSelectSuggestion(suggestion)} className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-all text-left group">
                        <div className="p-2.5 bg-gray-100 rounded-xl text-gray-400 group-hover:bg-sellit group-hover:text-white transition-all shrink-0">
                          {suggestion.type === 'category' ? <Tag size={18} /> : suggestion.type === 'listing' ? <Search size={18} /> : <Bot size={18} />}
                        </div>
                        <div className="flex-1 truncate">
                          <p className="font-bold text-gray-900 leading-tight truncate">{suggestion.label}</p>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{suggestion.type}{suggestion.extra && ` • ${suggestion.extra}`}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-10 text-center space-y-3">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300"><Bot size={32} /></div>
                    <p className="text-gray-400 font-bold text-sm">No quick matches for <span className="text-sellit">"{searchQuery}"</span></p>
                    <button onClick={() => setIsAssistantOpen(true)} className="text-[10px] font-black text-sellit uppercase tracking-widest hover:underline px-4 py-2 bg-sellit/5 rounded-full">Ask the campus AI Assistant instead</button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-4 ml-6 lg:ml-12 shrink-0">
            <button onClick={() => setIsAssistantOpen(!isAssistantOpen)} className="p-3 bg-sellit/5 text-sellit rounded-2xl hover:bg-sellit hover:text-white transition-all shadow-sm flex items-center gap-2">
              <Bot size={22} strokeWidth={2.5} />
              <span className="hidden lg:block font-black text-[10px] uppercase tracking-widest">Campus AI</span>
            </button>

            <div className="h-10 w-px bg-gray-100 mx-2" />

            <div className="relative" ref={profileDropdownRef}>
              {!user ? (
                <button onClick={onLogout} className="flex items-center gap-2 bg-sellit text-white px-5 py-2.5 rounded-2xl font-bold shadow-lg shadow-sellit/20 hover:bg-sellit-dark transition-all transform hover:scale-105 active:scale-95">
                  <UserCircle size={20} />
                  <span>Login / Join</span>
                </button>
              ) : (
                <>
                  <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 p-1.5 hover:bg-gray-50 rounded-2xl transition-all border border-transparent hover:border-gray-100">
                    <div className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-sellit/10">
                      <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150" className="w-full h-full object-cover" alt="Profile" />
                    </div>
                    <div className="hidden lg:block text-left">
                      <p className="text-xs font-black text-gray-900 leading-none mb-1">{user?.name || 'Obokobong'}</p>
                      <p className="text-[9px] font-black text-sellit uppercase tracking-widest">Student Pro</p>
                    </div>
                    <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isProfileOpen && (
                    <div className="absolute top-full right-0 mt-3 w-64 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 p-2 z-50">
                      <div className="p-4 mb-2 bg-gray-50 rounded-2xl">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Campus ID Verified</p>
                        <p className="text-sm font-bold text-gray-900">{user?.email}</p>
                      </div>
                      <button onClick={() => { setActiveTab('Profile'); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 p-3 hover:bg-sellit/5 hover:text-sellit rounded-xl transition-all text-xs font-black uppercase tracking-widest">
                        <UserCircle size={18} /> My Dashboard
                      </button>
                      <button onClick={() => { setActiveTab('Messages'); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 p-3 hover:bg-sellit/5 hover:text-sellit rounded-xl transition-all text-xs font-black uppercase tracking-widest">
                        <MessageSquare size={18} /> My Messages
                      </button>
                      <button onClick={() => { setActiveTab('Notifications'); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 p-3 hover:bg-sellit/5 hover:text-sellit rounded-xl transition-all text-xs font-black uppercase tracking-widest">
                        <Bell size={18} /> My Alerts
                      </button>
                      <div className="h-px bg-gray-50 my-2" />
                      <button onClick={() => { onLogout(); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 p-3 hover:bg-red-50 text-red-500 rounded-xl transition-all text-xs font-black uppercase tracking-widest">
                        <LogOut size={18} /> Sign Out
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 h-full overflow-hidden">
          <div ref={scrollContainerRef} onScroll={handleScroll} className="h-full overflow-y-auto w-full scrollbar-hide">
            {renderContent()}
          </div>
        </main>

        <AIAssistant isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} onSwitchToSupport={handleSwitchToSupport} />

        <AuthRequiredModal
          isOpen={authModal.open}
          onClose={() => setAuthModal({ ...authModal, open: false })}
          onLogin={() => {
            setAuthModal({ ...authModal, open: false });
            onLogout(); // This actually takes the user to the login screen in this app structure
          }}
          action={authModal.action}
        />

        <PublicationSuccess
          isOpen={successModal.open}
          onClose={() => setSuccessModal({ ...successModal, open: false })}
          onViewListing={() => {
            if (successModal.listing) {
              handleOpenProduct(successModal.listing);
              navigate(`/product/${successModal.listing.id}`);
            }
            setSuccessModal({ ...successModal, open: false });
          }}
          onListAnother={() => {
            setSuccessModal({ ...successModal, open: false });
            navigate('/add');
          }}
          title={successModal.title}
          isUpdate={successModal.isUpdate}
        />
      </div>

      {selectedListing && (
        <ProductDetail
          listing={selectedListing}
          isOwner={((selectedListing.seller as any)._id || selectedListing.seller) === user?.id}
          onClose={() => {
            setSelectedListing(null);
            navigate(location.pathname.replace(/\/product\/[^\/]+/, '') || '/');
          }}
          onContact={async () => {
            if (!user) {
              setAuthModal({ open: true, action: 'start a chat' });
              return;
            }
            try {
              const sellerId = (selectedListing.seller as any)._id || selectedListing.seller;
              const sellerName = selectedListing.seller.name || 'Seller';
              const sellerAvatar = selectedListing.seller.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150';

              await startChatAction(sellerId, sellerName, sellerAvatar, {
                listingId: selectedListing.id,
                title: selectedListing.title,
                price: selectedListing.price,
                imageUrl: selectedListing.imageUrl,
                status: selectedListing.status
              });
              setSelectedListing(null);
              navigate(location.pathname.replace(/\/product\/[^\/]+/, '') || '/');
            } catch (err) {
              console.error('Failed to start chat:', err);
            }
          }}
          onMakeOffer={async (amount, message) => {
            if (!user) {
              setAuthModal({ open: true, action: 'make an offer' });
              return;
            }
            try {
              const offer = await storageService.addOffer({
                listingId: selectedListing.id,
                price: amount,
                message
              });
              setAllOffers(prev => [...prev, offer]);

              const sellerId = (selectedListing.seller as any)._id || selectedListing.seller;
              const sellerName = selectedListing.seller.name || 'Seller';
              const sellerAvatar = selectedListing.seller.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150';
              const productInfo = {
                listingId: selectedListing.id,
                title: selectedListing.title,
                price: selectedListing.price,
                imageUrl: selectedListing.imageUrl,
                status: selectedListing.status
              };

              if (sellerId === user.id) {
                showToast('Error', 'You cannot make an offer on your own item.', 'error');
                return;
              }

              const chat = await storageService.startChat(sellerId, false, productInfo);
              const newChat = {
                ...chat,
                id: (chat as any)._id || chat.id,
                contactName: sellerName,
                contactAvatar: sellerAvatar,
                messages: chat.messages || [],
                product: productInfo
              };

              setChats(prev => {
                const existing = prev.find(c => c.id === newChat.id);
                if (existing) {
                  return prev.map(c => c.id === newChat.id ? { ...c, product: productInfo } : c);
                }
                return [newChat, ...prev];
              });

              const offerMsg = `💰 **Offer**: ₦${amount.toLocaleString()}\n\n${message}`;
              await storageService.addMessage(chat.id, offerMsg);

              setActiveChatId(chat.id);
              navigate('/messages');
              setSelectedListing(null);
              showToast('Offer Sent!', `Your offer has been sent to ${sellerName}.`, 'success');
            } catch (err: any) {
              console.error('Failed to send offer:', err);
              if (err.response?.status === 400) {
                showToast('Error', err.response.data.message || 'Failed to start chat.', 'error');
              } else {
                showToast('Error', 'Failed to send offer.', 'error');
              }
            }
          }}
          onMarkSold={async (id) => {
            try {
              await storageService.updateListing(id, { status: 'sold' });
              setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'sold' } : l));
              showToast('Marked as Sold', 'Listing status updated.', 'success');
              setSelectedListing(null);
            } catch (err) {
              showToast('Error', 'Failed to update listing.', 'error');
            }
          }}
          onEdit={() => {
            setEditingListing(selectedListing);
            setSelectedListing(null);
          }}
          onCommitToBuy={(amount) => handleCommitToBuy(selectedListing.id, amount)}
          onToggleSave={toggleSave}
          onDelete={() => {
            if (confirm('Are you sure you want to delete this ad?')) {
              storageService.deleteListing(selectedListing.id).then(() => {
                setListings(prev => prev.filter(l => l.id !== selectedListing.id));
                setSelectedListing(null);
                showToast('Deleted', 'Listing removed.', 'success');
              });
            }
          }}
          userOffer={allOffers.find(o => o.listingId === selectedListing.id && (o as any).buyer?._id === user?.id)}
          onWithdrawOffer={handleWithdrawOffer}
        />
      )}

      <PublicationSuccess
        isOpen={successModal.open}
        title={successModal.title}
        isUpdate={successModal.isUpdate}
        onClose={() => setSuccessModal(prev => ({ ...prev, open: false }))}
        onViewListing={() => {
          if (successModal.listing) {
            handleOpenProduct({ ...successModal.listing, id: (successModal.listing as any)._id || successModal.listing.id });
          }
          setSuccessModal(prev => ({ ...prev, open: false }));
        }}
        onListAnother={() => {
          setSuccessModal(prev => ({ ...prev, open: false }));
          setActiveTab('Add Product');
        }}
        onShare={() => {
          const url = `${window.location.origin}/product/${successModal.listing?.id || (successModal.listing as any)?._id}`;
          if (navigator.share) {
            navigator.share({
              title: successModal.title,
              text: `Check out my listing on Sellit: ${successModal.title}`,
              url: url
            }).catch(() => {});
          } else {
            navigator.clipboard.writeText(url);
            showToast('Link Copied!', 'Share it with your friends on WhatsApp.', 'success');
          }
        }}
      />
    </div>
  );
};
