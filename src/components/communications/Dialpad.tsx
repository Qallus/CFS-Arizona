'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Phone, Delete, Loader2 } from 'lucide-react';
import { Device, Call } from '@twilio/voice-sdk';

interface DialpadProps {
  onCallStart: (call: any) => void;
  initialNumber?: string;
}

const dialpadKeys = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['*', '0', '#'],
];

const keyLetters: Record<string, string> = {
  '2': 'ABC',
  '3': 'DEF',
  '4': 'GHI',
  '5': 'JKL',
  '6': 'MNO',
  '7': 'PQRS',
  '8': 'TUV',
  '9': 'WXYZ',
};

export function Dialpad({ onCallStart, initialNumber }: DialpadProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [device, setDevice] = useState<Device | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-populate phone number from prop (e.g., from appointments)
  useEffect(() => {
    if (initialNumber) {
      setPhoneNumber(initialNumber);
    }
  }, [initialNumber]);

  // Initialize Twilio Device
  useEffect(() => {
    async function initDevice() {
      try {
        const response = await fetch('/api/twilio/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identity: 'sig360-user' }),
        });
        
        const { token, error } = await response.json();
        
        if (error) {
          setError(error);
          return;
        }

        const newDevice = new Device(token, {
          codecPreferences: [Call.Codec.PCMU, Call.Codec.Opus],
          allowIncomingWhileBusy: true,
        });

        newDevice.on('registered', () => {
          console.log('Twilio Device registered');
          setIsReady(true);
        });

        newDevice.on('error', (err) => {
          console.error('Twilio Device error:', err);
          setError(err.message);
        });

        newDevice.on('incoming', (call) => {
          console.log('Incoming call from:', call.parameters.From);
          onCallStart({
            type: 'incoming',
            call,
            from: call.parameters.From,
            status: 'ringing',
          });
        });

        await newDevice.register();
        setDevice(newDevice);
      } catch (err) {
        console.error('Failed to initialize device:', err);
        setError('Failed to initialize phone. Check your Twilio configuration.');
      }
    }

    initDevice();

    return () => {
      device?.destroy();
    };
  }, []);

  const handleKeyPress = useCallback((key: string) => {
    setPhoneNumber(prev => prev + key);
  }, []);

  const handleDelete = useCallback(() => {
    setPhoneNumber(prev => prev.slice(0, -1));
  }, []);

  const handleCall = useCallback(async () => {
    if (!device || !phoneNumber) return;

    setIsConnecting(true);
    setError(null);

    try {
      const call = await device.connect({
        params: {
          To: phoneNumber,
        },
      });

      call.on('accept', () => {
        console.log('Call accepted, CallSid:', call.parameters?.CallSid);
        onCallStart({
          type: 'outgoing',
          call,
          to: phoneNumber,
          status: 'in-progress',
          callSid: call.parameters?.CallSid,
        });
      });

      call.on('disconnect', () => {
        console.log('Call disconnected');
        setIsConnecting(false);
      });

      call.on('error', (err) => {
        console.error('Call error:', err);
        setError(err.message);
        setIsConnecting(false);
      });

      onCallStart({
        type: 'outgoing',
        call,
        to: phoneNumber,
        status: 'connecting',
        callSid: call.parameters?.CallSid || null,
      });
    } catch (err: any) {
      console.error('Failed to make call:', err);
      setError(err.message);
      setIsConnecting(false);
    }
  }, [device, phoneNumber, onCallStart]);

  return (
    <div className="space-y-4">
      {/* Phone Number Input */}
      <div className="relative">
        <Input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="Enter phone number"
          className="text-center text-2xl h-14 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
        />
        {phoneNumber && (
          <button
            onClick={handleDelete}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <Delete className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Dialpad Grid */}
      <div className="grid grid-cols-3 gap-2">
        {dialpadKeys.map((row, rowIndex) => (
          row.map((key) => (
            <button
              key={key}
              onClick={() => handleKeyPress(key)}
              className="flex flex-col items-center justify-center h-16 rounded-lg bg-secondary border border-border hover:bg-muted transition-colors"
            >
              <span className="text-2xl font-semibold text-foreground">{key}</span>
              {keyLetters[key] && (
                <span className="text-xs text-muted-foreground">{keyLetters[key]}</span>
              )}
            </button>
          ))
        ))}
      </div>

      {/* Call Button */}
      <Button
        onClick={handleCall}
        disabled={!phoneNumber || !isReady || isConnecting}
        className="w-full h-14 bg-green-600 hover:bg-green-700 text-white text-lg"
      >
        {isConnecting ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Phone className="w-5 h-5 mr-2" />
            Call
          </>
        )}
      </Button>

      {/* Status */}
      <div className="text-center">
        {error ? (
          <p className="text-red-400 text-sm">{error}</p>
        ) : (
          <p className="text-muted-foreground text-sm">
            {isReady ? '● Ready to call' : 'Initializing...'}
          </p>
        )}
      </div>
    </div>
  );
}
