import React, { useState } from 'react';
import { MediaItem } from '../types';
import {
  Play,
  Pause,
  Headphones,
  Video,
  Image as ImageIcon,
  Maximize2,
  Clock,
  BookOpen,
  User,
  X,
  Volume2,
  Lock,
  ArrowLeft,
} from 'lucide-react';

interface MediaViewProps {
  mediaItems: MediaItem[];
  onBack?: () => void;
}

const SILO_GALLERY = [
  { src: '/assets/media/leader-blessing.jpg', caption: 'Open Arms at Silo' },
  { src: '/assets/media/legacy-family.jpg', caption: 'Like Father, Like Son' },
  { src: '/assets/media/leader-podium.jpg', caption: 'Address to the Faithful' },
  { src: '/assets/media/regalia-portrait.jpg', caption: 'Ceremonial Regalia' },
  { src: '/assets/media/leader-reading.jpg', caption: 'Proclamation of the Word' },
  { src: '/assets/media/red-white-gathering.jpg', caption: 'Red & White Gathering' },
  { src: '/assets/media/leader-address.jpg', caption: 'Blessing the Congregation' },
  { src: '/assets/media/branch-procession.jpg', caption: 'Branch Procession' },
];

export const MediaView: React.FC<MediaViewProps> = ({ mediaItems, onBack }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeMedia, setActiveMedia] = useState<MediaItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(35);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; caption: string } | null>(null);

  const categories = ['All', 'Sermons', 'Announcements', 'Events', 'Archive'];

  const filteredItems =
    selectedCategory === 'All'
      ? mediaItems
      : mediaItems.filter((m) => m.category === selectedCategory);

  const handleOpenMedia = (item: MediaItem) => {
    if (item.type === 'photo') {
      setLightboxImage({ src: item.thumbnail, caption: item.title });
      return;
    }
    setActiveMedia(item);
    setIsPlaying(true);
    setPlaybackProgress(25);
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col pb-20 max-w-md mx-auto">
      {/* Top Header */}
      <div className="p-4 bg-white border-b border-slate-100">
        <div className="flex items-center justify-between">
          {onBack ? (
            <button
              onClick={onBack}
              className="flex items-center gap-1 text-slate-600 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Church Media & Sermons
          </h2>
          <div className="w-10" />
        </div>
        <p className="text-xs text-slate-500 mt-0.5 text-center">
          Approved sermons, choral music, and Silo announcements
        </p>

        {/* Category Pills */}
        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition ${
                selectedCategory === cat
                  ? 'bg-[#3F76C5] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Silo Photo Gallery — official photographs strip */}
      <div className="pt-4">
        <div className="flex items-center justify-between px-4 mb-2.5">
          <h3 className="text-sm font-black text-slate-900 tracking-tight">Silo Gallery</h3>
          <a
            href="https://www.instagram.com/iphcmediateam"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[10px] font-extrabold text-[#3F76C5] uppercase tracking-widest hover:underline"
          >
            <img
              src="/assets/media/media-team-logo.jpg"
              alt="IPHC Media Team"
              className="w-5 h-5 rounded-full object-cover border border-slate-200"
            />
            @iphcmediateam
          </a>
        </div>
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar px-4 pb-1.5">
          {SILO_GALLERY.map((photo) => (
            <button
              key={photo.src}
              onClick={() => setLightboxImage(photo)}
              className="relative shrink-0 w-32 h-44 rounded-2xl overflow-hidden border border-slate-200 shadow-xs active:scale-95 transition group"
            >
              <img
                src={photo.src}
                alt={photo.caption}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent p-2 pt-6 text-left">
                <p className="text-[9px] font-bold text-white leading-tight">{photo.caption}</p>
              </div>
              <div className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white/90">
                <Maximize2 className="w-3 h-3" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Media Cards Grid/List */}
      <div className="p-4 space-y-3.5 flex-1">
        {filteredItems.map((item) => {
          const isPhoto = item.type === 'photo';
          return (
            <div
              key={item.id}
              onClick={() => handleOpenMedia(item)}
              className="bg-white rounded-3xl overflow-hidden shadow-xs border border-slate-200/80 hover:border-slate-300 transition cursor-pointer active:scale-[0.99] group flex flex-col"
            >
              {/* Thumbnail Header with Play / Expand Overlay */}
              <div
                className={`relative w-full bg-slate-900 overflow-hidden ${
                  isPhoto ? 'aspect-[4/5] max-h-[400px]' : 'aspect-video'
                }`}
              >
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  loading="lazy"
                  className={`w-full h-full ${
                    isPhoto ? 'object-cover' : 'object-cover'
                  } group-hover:scale-105 transition duration-500 opacity-95`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/60 text-white backdrop-blur-md flex items-center gap-1">
                    {item.type === 'video' ? (
                      <Video className="w-3 h-3 text-[#D13138]" />
                    ) : item.type === 'photo' ? (
                      <ImageIcon className="w-3 h-3 text-emerald-300" />
                    ) : (
                      <Headphones className="w-3 h-3 text-[#3F76C5]" />
                    )}
                    <span>{item.category}</span>
                  </span>

                  {item.isMemberOnly && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D13138]/90 text-white flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      <span>Member Pass</span>
                    </span>
                  )}
                </div>

                {/* Duration / type pill */}
                <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-black/70 text-white text-[11px] font-mono font-medium flex items-center gap-1 backdrop-blur-xs">
                  <Clock className="w-3 h-3 text-slate-300" />
                  <span>{item.duration}</span>
                </div>

                {/* Center Action Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className={`w-12 h-12 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-xl group-hover:scale-110 transition ${
                      isPhoto
                        ? 'group-hover:bg-emerald-600 group-hover:text-white'
                        : 'group-hover:bg-[#D13138] group-hover:text-white'
                    }`}
                  >
                    {isPhoto ? (
                      <Maximize2 className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5 fill-current translate-x-0.5" />
                    )}
                  </div>
                </div>
              </div>

              {/* Description & Metadata */}
              <div className="p-4">
                <h3 className="text-sm font-bold text-slate-900 leading-snug group-hover:text-[#3F76C5] transition">
                  {item.title}
                </h3>

                {item.description && (
                  <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                )}

                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1 truncate max-w-[200px]">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-700 truncate">{item.speaker}</span>
                  </span>
                  <span>{item.date}</span>
                </div>

                {item.scriptureReference && (
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1 text-[11px] text-[#3F76C5] font-semibold">
                    <BookOpen className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.scriptureReference}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Inline Player Modal (No external page, plays right inside app) */}
      {activeMedia && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-950 text-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#3F76C5]">
                Now Playing • {activeMedia.category}
              </span>
              <button
                onClick={() => {
                  setIsPlaying(false);
                  setActiveMedia(null);
                }}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Media Screen / Visualizer */}
            <div className="mt-4 relative aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-inner">
              <img
                src={activeMedia.thumbnail}
                alt={activeMedia.title}
                className="w-full h-full object-cover opacity-70"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

              {/* Animated audio bars if playing */}
              {isPlaying && (
                <div className="absolute bottom-3 left-4 flex items-end gap-1 h-5">
                  <div className="w-1 bg-[#D13138] rounded-full animate-pulse h-3" />
                  <div className="w-1 bg-[#3F76C5] rounded-full animate-pulse h-5 delay-75" />
                  <div className="w-1 bg-[#D13138] rounded-full animate-pulse h-4 delay-150" />
                  <div className="w-1 bg-white rounded-full animate-pulse h-2 delay-100" />
                </div>
              )}

              <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/60 text-[10px] font-mono text-emerald-400 flex items-center gap-1 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>ONLINE STREAM</span>
              </div>
            </div>

            {/* Title & Info */}
            <div className="mt-4">
              <h3 className="text-base font-bold text-white leading-snug">
                {activeMedia.title}
              </h3>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                <span className="text-blue-300 font-medium">{activeMedia.speaker}</span>
                <span>•</span>
                <span>{activeMedia.duration}</span>
              </p>
              {activeMedia.scriptureReference && (
                <p className="text-[11px] text-[#3F76C5] font-semibold mt-1 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{activeMedia.scriptureReference}</span>
                </p>
              )}
            </div>

            {/* Scrub Progress Bar */}
            <div className="mt-5">
              <div
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  setPlaybackProgress(Math.round((clickX / rect.width) * 100));
                }}
                className="w-full h-2 bg-slate-800 rounded-full overflow-hidden cursor-pointer relative"
              >
                <div
                  className="h-full bg-gradient-to-r from-[#3F76C5] to-[#D13138] rounded-full transition-all"
                  style={{ width: `${playbackProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1.5">
                <span>08:45</span>
                <span>{activeMedia.duration}</span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="mt-4 flex items-center justify-center gap-6">
              <button
                onClick={() => setPlaybackProgress((prev) => Math.max(0, prev - 10))}
                className="text-xs font-semibold text-slate-400 hover:text-white"
              >
                -15s
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#D13138] to-[#EF4444] text-white flex items-center justify-center shadow-lg shadow-red-500/30 hover:scale-105 active:scale-95 transition"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : (
                  <Play className="w-6 h-6 fill-current translate-x-0.5" />
                )}
              </button>

              <button
                onClick={() => setPlaybackProgress((prev) => Math.min(100, prev + 10))}
                className="text-xs font-semibold text-slate-400 hover:text-white"
              >
                +15s
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Photo Lightbox (gallery & photo media items) */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <div className="flex items-center justify-between p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
              Silo Gallery • Official
            </span>
            <button
              onClick={() => setLightboxImage(null)}
              className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center p-4 min-h-0">
            <img
              src={lightboxImage.src}
              alt={lightboxImage.caption}
              className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="p-4 pb-8 text-center">
            <p className="text-sm font-bold text-white">{lightboxImage.caption}</p>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">
              IPHC Media Team • Silo Zuurbekom
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
