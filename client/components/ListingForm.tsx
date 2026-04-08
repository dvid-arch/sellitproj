
import React, { useState, useRef, useEffect } from 'react';
import {
  X, Upload, Trash2,
  ChevronLeft, ChevronRight, Edit3, Check,
  MapPin, CheckCircle2, Zap, Headphones
} from 'lucide-react';
import { geminiService } from '../services/gemini';
import { useToast } from '../context/ToastContext';
import { uploadToCloudinary } from '../services/cloudinary';

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  type: 'image' | 'pdf';
  preview?: string;
}

interface ListingFormProps {
  onClose: () => void;
  onSubmit: (listing: any) => void;
  initialData?: any; // To support Edit mode
}

export const ListingForm: React.FC<ListingFormProps> = ({ onClose, onSubmit, initialData }) => {
  const [step, setStep] = useState<'details' | 'preview'>('details');
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [currentPreviewIdx, setCurrentPreviewIdx] = useState(0);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    id: initialData?.id || '',
    title: initialData?.title || '',
    description: initialData?.description || '',
    condition: initialData?.condition || 'Fairly used',
    category: initialData?.category || 'Home and furniture',
    price: initialData?.price?.toString() || '',
    isNegotiable: initialData?.isNegotiable ?? true,
    campus: initialData?.campus || 'University of Lagos',
    location: initialData?.location || '',
    isUrgent: initialData?.isUrgent || false,
    notes: ''
  });

  useEffect(() => {
    if (initialData) {
      if (initialData.images && initialData.images.length > 0) {
        const initialFiles = initialData.images.map((url: string, index: number) => ({
          id: `initial-${index}`,
          name: `Image ${index + 1}`,
          size: 'N/A',
          type: 'image',
          preview: url
        }));
        setFiles(initialFiles);
      } else if (initialData.imageUrl) {
        setFiles([{
          id: 'initial',
          name: 'Product Image',
          size: 'N/A',
          type: 'image',
          preview: initialData.imageUrl
        }]);
      }
    }
  }, [initialData]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      const newFilesPromises = Array.from(selectedFiles).map(async (file: any) => {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        return {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
          type: file.type.includes('pdf') ? 'pdf' : 'image',
          preview: base64
        };
      });

      const newFiles = await Promise.all(newFilesPromises);
      setFiles(prev => [...prev, ...newFiles as UploadedFile[]]);
    }
  };

  const removeFile = (id: string) => {
    const fileToRemove = files.find(f => f.id === id);
    if (fileToRemove?.preview && fileToRemove.preview.startsWith('blob:') && id !== 'initial') {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleNext = () => {
    if (step === 'details') {
      if (formData.notes) return;
      setStep('preview');
    } else {
      if (initialData) {
        finalSubmit(); // No premium modal for updates
      } else {
        setShowPremiumModal(true);
      }
    }
  };

  const finalSubmit = async () => {
    if (formData.notes) return;
    
    // Safety check for authentication
    const userStr = localStorage.getItem('sellit_user');
    const token = localStorage.getItem('sellit_token');
    if (!userStr || !token) {
      showToast('Authentication Required', 'Please log in to publish a product.', 'error');
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    
    try {
      showToast('Step 1/2', 'Uploading your product images to Cloudinary...', 'info');

      // Upload all images to Cloudinary
      const imageFiles = files.filter(f => f.type === 'image');
      const uploadPromises = imageFiles.map(file => {
        // If it's already a URL (from initialData), don't re-upload
        if (file.preview?.startsWith('http')) return Promise.resolve(file.preview);
        // Otherwise upload the base64/file
        return uploadToCloudinary(file.preview!);
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      if (uploadedUrls.length === 0) {
        setIsSubmitting(false);
        showToast('Photos required', 'Please upload at least one image of your item.', 'error');
        return;
      }

      showToast('Step 2/2', 'Securing your listing on Sellit...', 'info');

      onSubmit({
        ...formData,
        price: parseFloat(formData.price.replace(/[^0-9.]/g, '')) || 0,
        imageUrl: uploadedUrls[0], // Primary image
        images: uploadedUrls // All images
      });

      showToast(
        initialData ? 'Update Saved!' : 'Product Published!',
        initialData ? 'Your listing has been updated.' : 'Your product is now live on Sellit.',
        'success'
      );
    } catch (err: any) {
      console.error('Submission error:', err);
      showToast('Upload Failed', err.message || 'There was a problem uploading your images.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPreview = step === 'preview';

  return (
    <div className="flex flex-col h-full bg-[#F8FAFB] animate-in fade-in duration-500">
      <div className="px-12 pt-10 pb-6 shrink-0">
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">{initialData ? 'Edit Listing' : 'Add Product'}</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-12 pb-12 scrollbar-hide">
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-10 flex flex-col lg:flex-row gap-12">
          <div className="sr-only opacity-0 h-0 w-0" aria-hidden="true">
            <input type="text" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
          </div>

          <div className="flex-1 space-y-8 min-h-[500px]">
            {!isPreview ? (
              <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-sellit/30 rounded-[2rem] p-12 text-center bg-[#F9FBFC] hover:bg-white hover:border-sellit transition-all group cursor-pointer">
                  <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple className="hidden" accept="image/*" />
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-gray-400 group-hover:text-sellit transition-colors"><Upload size={32} /></div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">Upload Product Photos</h3>
                      <p className="text-gray-400 text-sm font-medium leading-relaxed max-w-[240px] mx-auto">Click to browse or drag and drop your files here</p>
                    </div>
                  </div>
                </div>
                <div className="mt-8 space-y-4">
                  <h4 className="text-lg font-bold text-gray-800">Files ({files.length})</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {files.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl group hover:border-sellit/30 transition-all">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 border border-gray-50 flex items-center justify-center shrink-0">
                            {file.type === 'pdf' ? <div className="text-sellit font-bold text-xs">PDF</div> : <img src={file.preview} className="w-full h-full object-cover" alt={file.name} />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 truncate text-sm">{file.name}</p>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{file.size}</p>
                          </div>
                        </div>
                        <button onClick={() => removeFile(file.id)} className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0"><Trash2 size={20} /></button>
                      </div>
                    ))}
                    {files.length === 0 && <div className="col-span-full py-12 text-center text-gray-400 font-medium bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">No images uploaded yet</div>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold text-gray-900">Preview</h2>
                  {files.filter(f => f.type === 'image').length > 1 && (
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm">
                      <span className="text-[10px] font-black text-sellit uppercase tracking-widest">
                        {currentPreviewIdx + 1} / {files.filter(f => f.type === 'image').length} Photos
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="relative aspect-[16/10] rounded-[2.5rem] overflow-hidden bg-gray-100 group shadow-sm border border-gray-100">
                  {files.filter(f => f.type === 'image').length > 0 ? (
                    <>
                      <img 
                        src={files.filter(f => f.type === 'image')[currentPreviewIdx]?.preview} 
                        className="w-full h-full object-cover transition-all duration-500" 
                        alt="Preview" 
                      />
                      
                      {files.filter(f => f.type === 'image').length > 1 && (
                        <>
                          <div className="absolute inset-y-0 left-0 flex items-center pl-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentPreviewIdx(prev => (prev === 0 ? files.filter(f => f.type === 'image').length - 1 : prev - 1));
                              }}
                              className="p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl text-gray-900 hover:text-sellit transition-all hover:scale-110 active:scale-90"
                            >
                              <ChevronLeft size={24} />
                            </button>
                          </div>
                          
                          <div className="absolute inset-y-0 right-0 flex items-center pr-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentPreviewIdx(prev => (prev === files.filter(f => f.type === 'image').length - 1 ? 0 : prev + 1));
                              }}
                              className="p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl text-gray-900 hover:text-sellit transition-all hover:scale-110 active:scale-90"
                            >
                              <ChevronRight size={24} />
                            </button>
                          </div>

                          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 px-3 py-2 bg-black/10 backdrop-blur-md rounded-full">
                            {files.filter(f => f.type === 'image').map((_, i) => (
                              <button
                                key={i}
                                onClick={() => setCurrentPreviewIdx(i)}
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                  currentPreviewIdx === i ? 'bg-white w-6' : 'bg-white/40 w-1.5 hover:bg-white/60'
                                }`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 italic font-medium">No images uploaded</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="w-full lg:w-[480px] shrink-0">
            <div className="flex items-center justify-between mb-8 h-10"><h2 className="text-2xl font-bold text-gray-900">Product Info</h2>{isPreview && <button onClick={() => setStep('details')} className="flex items-center gap-2 px-4 py-2 border border-sellit text-sellit rounded-xl font-bold text-sm hover:bg-sellit/5 transition-all"><Edit3 size={16} />Edit Details</button>}</div>
            <div className={`space-y-6 ${isPreview ? 'opacity-70 pointer-events-none' : ''}`}>
              <div className="space-y-2"><label className="text-sm font-bold text-gray-700 ml-1">Title</label><input type="text" disabled={isPreview} maxLength={80} placeholder="e.g. iPhone 13 pro max 256 GB" className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-sellit/5 transition-all font-medium text-gray-900" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} /></div>
              <div className="space-y-2"><label className="text-sm font-bold text-gray-700 ml-1">Description</label><textarea rows={4} disabled={isPreview} maxLength={500} placeholder="Describe your item details..." className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-sellit/5 transition-all font-medium resize-none text-gray-900" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><label className="text-sm font-bold text-gray-700 ml-1">Condition</label><select disabled={isPreview} className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-sellit/5 transition-all font-bold appearance-none text-gray-900" value={formData.condition} onChange={e => setFormData({ ...formData, condition: e.target.value })}><option>Brand New</option><option>Like New</option><option>Fairly used</option></select></div>
                <div className="space-y-2"><label className="text-sm font-bold text-gray-700 ml-1">Category</label><select disabled={isPreview} className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-sellit/5 transition-all font-bold appearance-none text-gray-900" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}><option>Electronics</option><option>Books</option><option>Fashion</option><option>Kitchen</option></select></div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Pickup Location (Optional)</label>
                <input 
                  type="text" 
                  disabled={isPreview} 
                  placeholder="e.g. Mariere Hostel, Engineering Gate" 
                  className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-sellit/5 transition-all font-medium text-gray-900" 
                  value={formData.location} 
                  onChange={e => setFormData({ ...formData, location: e.target.value })} 
                />
              </div>
              <div className="space-y-2"><label className="text-sm font-bold text-gray-700 ml-1">Price (₦)</label><div className="relative"><input type="text" disabled={isPreview} placeholder="Enter price in Naira" className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-sellit/5 transition-all font-bold text-gray-900" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) })} /></div></div>
            </div>
          </div>
        </div>
        <div className="mt-8 flex items-center gap-4 pb-12">
          <button
            onClick={handleNext}
            className={`px-12 py-4 bg-sellit text-white rounded-2xl font-bold text-lg shadow-lg hover:bg-sellit-dark transition-all active:scale-[0.98] flex items-center gap-3 disabled:opacity-50 ${isSubmitting ? 'cursor-wait' : ''}`}
            disabled={!formData.title || loading || isSubmitting}
          >
            {isPreview ? (isSubmitting ? 'Publishing...' : (initialData ? 'Update Listing' : 'Publish Listing')) : 'Next'}
          </button>
          <button
            onClick={onClose}
            className="px-8 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold text-lg hover:bg-gray-200 transition-all active:scale-[0.98]"
          >
            Cancel
          </button>
        </div>
      </div>

      {showPremiumModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-500" onClick={() => setShowPremiumModal(false)} />
          <div className="relative w-full max-w-[500px] bg-white rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-sellit via-sellit-dark to-sellit" />
            <button onClick={() => setShowPremiumModal(false)} className="absolute top-8 right-8 p-2.5 bg-gray-50 text-gray-400 hover:text-gray-900 rounded-full transition-all z-10"><X size={20} /></button>
            <div className="p-10 pt-12 space-y-8">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-sellit/10 text-sellit rounded-full text-[10px] font-black uppercase tracking-widest mb-4">Recommended</div>
                <h2 className="text-4xl font-black text-gray-900 mb-3 tracking-tight">Premium Boost</h2>
                <p className="text-gray-500 font-medium leading-relaxed">Get featured placement, reach more students, and sell your items up to 5x faster.</p>
              </div>
              <div className="p-6 bg-gray-50 rounded-3xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">One-time payment</p>
                  <div className="text-4xl font-black text-gray-900 italic">₦500 <span className="text-sm text-gray-400 font-bold not-italic">/item</span></div>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-sellit"><CheckCircle2 size={32} /></div>
              </div>
              <div className="space-y-4 py-2">
                {['Top of campus search results', 'Upload up to 10 high-res images', 'Priority mobile notifications', 'Premium Seller badge'].map((f, i) => (
                  <div key={i} className="flex items-start gap-4 animate-in slide-in-from-left duration-500">
                    <div className="mt-1 w-5 h-5 rounded-full bg-sellit/10 flex items-center justify-center shrink-0">
                      <Check size={12} className="text-sellit stroke-[4]" />
                    </div>
                    <p className="text-gray-700 font-bold text-sm">{f}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={finalSubmit}
                disabled={isSubmitting}
                className="w-full bg-sellit text-white py-5 rounded-[2rem] font-black text-xl shadow-xl shadow-sellit/25 hover:bg-sellit-dark transition-all active:scale-[0.98] flex items-center justify-center gap-3"
              >
                {isSubmitting ? 'Publishing...' : (
                  <>
                    <Zap size={20} fill="white" />
                    Subscribe & Publish
                  </>
                )}
              </button>
              <button onClick={finalSubmit} className="w-full py-2 text-gray-400 font-bold text-sm hover:text-gray-600 transition-colors">Or publish without boost</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
