
import { User, Listing, Chat, Notification, Broadcast, Offer, Transaction } from '../types.ts';
import { api } from './api';

class StorageService {
  private readonly KEYS = {
    USER: 'sellit_user',
  };

  // User Management
  saveUser(user: any): void {
    localStorage.setItem(this.KEYS.USER, JSON.stringify(user));
  }

  getUser(): any | null {
    const user = localStorage.getItem(this.KEYS.USER);
    return user ? JSON.parse(user) : null;
  }

  logout(): void {
    localStorage.removeItem(this.KEYS.USER);
    localStorage.removeItem('sellit_token');
  }

  // Listings Management
  async getListings(): Promise<Listing[]> {
    return api.get('/listings');
  }

  async getListing(id: string): Promise<Listing> {
    return api.get(`/listings/${id}`);
  }

  async addListing(listing: Listing): Promise<Listing> {
    return api.post('/listings', listing);
  }

  async updateListing(id: string, updates: Partial<Listing>): Promise<Listing> {
    return api.put(`/listings/${id}`, updates);
  }

  async deleteListing(id: string): Promise<void> {
    return api.delete(`/listings/${id}`);
  }

  // Chats Management
  async getChats(): Promise<Chat[]> {
    return api.get('/chats');
  }

  async addMessage(chatId: string, text: string): Promise<Chat> {
    return api.post(`/chats/${chatId}/messages`, { text });
  }

  async startChat(participantId: string, isSupport: boolean = false, product?: any): Promise<Chat> {
    return api.post('/chats', { participantId, isSupport, product });
  }

  // Broadcasts Management
  async getBroadcasts(): Promise<Broadcast[]> {
    const broadcasts = await api.get('/broadcasts');
    return broadcasts.map((b: any) => ({
      ...b,
      author: typeof b.author === 'object' ? b.author.name : b.author,
      authorId: typeof b.author === 'object' ? b.author._id : b.authorId
    }));
  }

  async addBroadcast(broadcast: Broadcast): Promise<Broadcast> {
    const newBroadcast = await api.post('/broadcasts', broadcast);
    // Normalize response for immediate UI update
    return {
      ...newBroadcast,
      author: typeof newBroadcast.author === 'object' ? newBroadcast.author.name : newBroadcast.author,
      authorId: typeof newBroadcast.author === 'object' ? newBroadcast.author._id : newBroadcast.authorId
    };
  }

  async deleteBroadcast(id: string): Promise<void> {
    return api.delete(`/broadcasts/${id}`);
  }

  // Offers Management
  async getOffers(): Promise<Offer[]> {
    return api.get('/offers');
  }

  async addOffer(offer: { listingId: string; price: number; message: string }): Promise<Offer> {
    return api.post('/offers', offer);
  }

  async updateOfferStatus(id: string, status: string, price?: number): Promise<Offer> {
    return api.put(`/offers/${id}`, { status, price });
  }

  async withdrawOffer(id: string): Promise<void> {
    return api.delete(`/offers/${id}`);
  }

  async commitToBuy(id: string): Promise<Listing> {
    return api.put(`/listings/${id}/commit`, {});
  }

  // Notifications Management
  async getNotifications(): Promise<Notification[]> {
    return api.get('/notifications');
  }

  async markNotificationRead(id: string): Promise<void> {
    return api.put(`/notifications/${id}/read`, {});
  }

  async seedNotifications(): Promise<void> {
    return api.post('/notifications/seed', {});
  }

  // Saved Listings & Profile Management
  async getSavedListings(): Promise<string[]> {
    const user = await api.get('/auth/me');
    return user.savedListings || [];
  }

  async updateProfile(updates: any): Promise<any> {
    return api.put('/auth/me', updates);
  }

  async toggleSavedListing(id: string): Promise<void> {
    const current = await this.getSavedListings();
    const isSaved = current.includes(id);
    const newSaved = isSaved
      ? current.filter(cid => cid !== id)
      : [...current, id];

    await this.updateProfile({ savedListings: newSaved });
  }

  async getTransactions(): Promise<Transaction[]> {
    return api.get('/transactions');
  }

  // Misc helper for initialization
  isFirstTimeUser(): boolean {
    return !localStorage.getItem('sellit_user');
  }

  // Legacy sync methods replaced by async versions
  saveOffers(offers: Offer[]): void { }
  saveNotifications(notifications: Notification[]): void { }
  saveListings(listings: Listing[]): void { }
  saveSavedListings(ids: string[]): void { }
  saveBroadcasts(broadcasts: Broadcast[]): void { }
  saveChats(chats: Chat[]): void { }
}

export const storageService = new StorageService();
