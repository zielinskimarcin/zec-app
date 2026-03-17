import { Mail, ExternalLink, Briefcase, MapPin, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';

interface Lead {
  id: number;
  name: string;
  description: string;
  industry: string;
  city: string;
  email: string;
  website: string;
  message: string;
  isBlurred: boolean;
}

interface LeadRowProps {
  lead: Lead;
  dark?: boolean;
}

export function LeadRow({ lead, dark = false }: LeadRowProps) {
  const [showMessage, setShowMessage] = useState(true);

  return (
    <div className="relative">
      <div className={`rounded-xl border transition-all ${
        dark 
          ? 'bg-white/5 border-white/10 hover:border-white/20 backdrop-blur-xl' 
          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
      }`}>
        {/* Blur overlay for premium leads */}
        {lead.isBlurred && (
          <div className={`absolute inset-0 rounded-xl z-10 flex items-center justify-center ${
            dark ? 'backdrop-blur-sm bg-black/60' : 'backdrop-blur-sm bg-white/60'
          }`}>
            <div className="text-center">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg mb-2 ${
                dark 
                  ? 'bg-white text-black' 
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20'
              }`}>
                <Lock className="size-4" />
                <span className="text-sm font-medium">Premium</span>
              </div>
              <p className={`text-sm ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                Unlock full data
              </p>
            </div>
          </div>
        )}

        <div className={`p-6 ${lead.isBlurred ? 'select-none' : ''}`}>
          {/* Header */}
          <div className="mb-4">
            <h3 className={`text-lg font-semibold mb-2 ${dark ? 'text-white' : 'text-gray-900'}`}>
              {lead.name}
            </h3>
            <p className={`leading-relaxed ${dark ? 'text-gray-300' : 'text-gray-600'}`}>
              {lead.description}
            </p>
          </div>

          {/* Contact info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
            <div className={`flex flex-col gap-1 ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
              <div className="flex items-center gap-1.5">
                <Briefcase className="size-3.5 shrink-0" />
                <span className="text-xs opacity-70">Branża</span>
              </div>
              <span className={`font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{lead.industry}</span>
            </div>

            <div className={`flex flex-col gap-1 ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
              <div className="flex items-center gap-1.5">
                <MapPin className="size-3.5 shrink-0" />
                <span className="text-xs opacity-70">Miasto</span>
              </div>
              <span className={`font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{lead.city}</span>
            </div>

            <div className={`flex flex-col gap-1 ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
              <div className="flex items-center gap-1.5">
                <Mail className="size-3.5 shrink-0" />
                <span className="text-xs opacity-70">Email</span>
              </div>
              <span className={`font-medium ${dark ? 'text-white' : 'text-gray-900'} truncate`}>{lead.email}</span>
            </div>

            <div className={`flex flex-col gap-1 ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
              <div className="flex items-center gap-1.5">
                <ExternalLink className="size-3.5 shrink-0" />
                <span className="text-xs opacity-70">Strona</span>
              </div>
              <a
                href={`https://${lead.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`font-medium truncate ${dark ? 'text-white hover:text-gray-300' : 'text-gray-900 hover:text-indigo-600'} hover:underline`}
              >
                {lead.website}
              </a>
            </div>
          </div>

          {/* Actions */}
          {!lead.isBlurred && (
            <div className={`flex items-center gap-3 pt-4 border-t ${
              dark ? 'border-white/10' : 'border-gray-100'
            }`}>
              <button
                onClick={() => setShowMessage(!showMessage)}
                className={`flex-1 px-4 py-2 rounded-lg transition-all text-sm font-medium flex items-center justify-center gap-2 ${
                  dark 
                    ? 'bg-white/10 text-white hover:bg-white/20' 
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {showMessage ? (
                  <>
                    <ChevronUp className="size-4" />
                    Hide message
                  </>
                ) : (
                  <>
                    <ChevronDown className="size-4" />
                    View AI message
                  </>
                )}
              </button>

              <button className={`px-6 py-2 rounded-lg transition-all text-sm font-medium ${
                dark 
                  ? 'bg-white text-black hover:bg-gray-200' 
                  : 'bg-black text-white hover:bg-gray-800'
              }`}>
                Send
              </button>
            </div>
          )}

          {/* Message preview */}
          <AnimatePresence>
            {showMessage && !lead.isBlurred && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className={`mt-4 pt-4 border-t ${dark ? 'border-white/10' : 'border-gray-100'}`}>
                  <div className={`rounded-lg p-4 mb-2 ${
                    dark 
                      ? 'bg-white/5 border border-white/10' 
                      : 'bg-gradient-to-br from-indigo-50/50 to-purple-50/50 border border-indigo-100'
                  }`}>
                    <p className={`text-sm leading-relaxed ${dark ? 'text-gray-200' : 'text-gray-700'}`}>
                      {lead.message}
                    </p>
                  </div>
                  <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-500'}`}>
                    ✨ Generated by AI • Edit before sending
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}