import React, { useEffect, useState, useRef } from 'react';
import { signOut } from 'firebase/auth';
import { ref, onValue, set } from 'firebase/database';
import { auth, db } from '../lib/firebase';
import { speak } from '../lib/voice';
import { 
  Thermometer, 
  Droplets, 
  Power, 
  LogOut, 
  Mic, 
  Loader2,
  Sparkles,
  RefreshCw,
  Box,
  User
} from 'lucide-react';
import { RelayState, SensorData } from '../types';

export default function Dashboard() {
  const [sensors, setSensors] = useState<SensorData>({ suhu: 0, kelembapan: 0 });
  const [relays, setRelays] = useState<RelayState>({ r1: false, r2: false, r3: false, r4: false });
  const [isListening, setIsListening] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [voiceLog, setVoiceLog] = useState<string>('Tekan tombol mikrofon untuk berbicara.');
  
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Listen for Sensor Data
    const suhuRef = ref(db, '/IoT/Suhu');
    const humRef = ref(db, '/IoT/Kelembapan');

    const unSuhu = onValue(suhuRef, (snapshot) => {
      setSensors((prev) => ({ ...prev, suhu: snapshot.val() || 0 }));
    });
    
    const unHum = onValue(humRef, (snapshot) => {
      setSensors((prev) => ({ ...prev, kelembapan: snapshot.val() || 0 }));
    });

    // Listen for Relay State
    const unR1 = onValue(ref(db, '/IoT/Relay1'), (s) => setRelays(p => ({ ...p, r1: !!s.val() })));
    const unR2 = onValue(ref(db, '/IoT/Relay2'), (s) => setRelays(p => ({ ...p, r2: !!s.val() })));
    const unR3 = onValue(ref(db, '/IoT/Relay3'), (s) => setRelays(p => ({ ...p, r3: !!s.val() })));
    const unR4 = onValue(ref(db, '/IoT/Relay4'), (s) => setRelays(p => ({ ...p, r4: !!s.val() })));

    return () => {
      unSuhu(); unHum(); unR1(); unR2(); unR3(); unR4();
    };
  }, []);

  const toggleRelay = async (relayNum: 1|2|3|4, currentState: boolean) => {
    stopAnimation();
    try {
      await set(ref(db, `/IoT/Relay${relayNum}`), !currentState);
    } catch (e) {
      console.error(e);
    }
  };

  const setAllRelays = async (state: boolean) => {
    await Promise.all([
      set(ref(db, '/IoT/Relay1'), state),
      set(ref(db, '/IoT/Relay2'), state),
      set(ref(db, '/IoT/Relay3'), state),
      set(ref(db, '/IoT/Relay4'), state),
    ]);
  };

  const stopAnimation = () => {
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
      animationIntervalRef.current = null;
    }
    setIsAnimating(false);
  };

  const runAnimation1 = async () => {
    stopAnimation();
    setIsAnimating(true);
    let step = 0;
    // Sequential Chaser
    animationIntervalRef.current = setInterval(async () => {
      const states = [false, false, false, false];
      states[step % 4] = true;
      
      await Promise.all([
        set(ref(db, '/IoT/Relay1'), states[0]),
        set(ref(db, '/IoT/Relay2'), states[1]),
        set(ref(db, '/IoT/Relay3'), states[2]),
        set(ref(db, '/IoT/Relay4'), states[3]),
      ]);
      
      step++;
    }, 500);
  };

  const runAnimation2 = async () => {
    stopAnimation();
    setIsAnimating(true);
    let toggle = false;
    // Blink all
    animationIntervalRef.current = setInterval(async () => {
      toggle = !toggle;
      await setAllRelays(toggle);
    }, 800);
  };

  // Voice Control
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser tidak mendukung Web Speech API. Coba gunakan Google Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'id-ID';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceLog("Mendengarkan...");
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      setVoiceLog(`Perintah ditangkap: "${transcript}"`);
      handleVoiceCommand(transcript);
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      setVoiceLog("Gagal menangkap suara: " + event.error);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleVoiceCommand = (command: string) => {
    // 1. Matikan / Hidupkan Relay
    const onKeywords = ["nyalakan", "hidupkan", "aktifkan", "on"];
    const offKeywords = ["matikan", "padamkan", "nonaktifkan", "off"];
    
    // Cek action
    const isTurnOn = onKeywords.some(k => command.includes(k));
    const isTurnOff = offKeywords.some(k => command.includes(k));

    if (isTurnOn || isTurnOff) {
      const state = isTurnOn;
      if (command.includes("semua")) {
        setAllRelays(state);
        speak(`Baik, ${isTurnOn ? 'menyalakan' : 'mematikan'} semua relay.`);
        return;
      }
      if (command.includes("satu") || command.includes("1")) toggleRelay(1, !state);
      if (command.includes("dua") || command.includes("2")) toggleRelay(2, !state);
      if (command.includes("tiga") || command.includes("3")) toggleRelay(3, !state);
      if (command.includes("empat") || command.includes("4")) toggleRelay(4, !state);
      
      speak(`Perintah sakelar diterima.`);
      return;
    }

    // 2. Baca Suhu Sensor
    if (command.includes("suhu")) {
      speak(`Suhu saat ini adalah ${sensors.suhu} derajat celcius.`);
      return;
    }
    
    // 3. Baca Kelembapan Sensor
    if (command.includes("kelembapan") || command.includes("kelembaban")) {
      speak(`Kelembapan saat ini adalah ${sensors.kelembapan} persen.`);
      return;
    }

    if (command.includes("variasi 1") || command.includes("variasi satu")) {
       runAnimation1();
       speak("Menjalankan variasi satu.");
       return;
    }

    if (command.includes("variasi 2") || command.includes("variasi dua")) {
       runAnimation2();
       speak("Menjalankan variasi dua.");
       return;
    }

    if (command.includes("hentikan variasi") || command.includes("berhenti variasi") || command.includes("stop animasi") || command.includes("hentikan animasi")) {
       stopAnimation();
       speak("Animasi dihentikan.");
       return;
    }

    setVoiceLog(`Perintah "${command}" tidak dikenali.`);
  };

  return (
    <div className="bg-slate-950 text-slate-100 flex flex-col font-sans overflow-x-hidden min-h-screen p-4 sm:p-8">
      <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Box className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">DANE-27E94 <span className="text-indigo-400">CORE</span></h1>
            <p className="text-xs text-slate-500 font-mono">ID: G-JG52NNVGL4 | FB-RTDB CONNECTED</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium">{auth.currentUser?.email || "dane_admin@domain.com"}</p>
            <p className="text-[10px] uppercase tracking-widest text-indigo-400">Authorized User</p>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-indigo-500 p-0.5 overflow-hidden bg-slate-800 flex items-center justify-center text-slate-400">
            {auth.currentUser?.photoURL ? (
              <img src={auth.currentUser.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" />
            ) : (
              <User className="w-5 h-5" />
            )}
          </div>
          <button onClick={() => signOut(auth)} className="text-slate-400 hover:text-white transition-colors ml-2" title="Keluar">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto w-full">
        {/* Left: Monitoring & Voice */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          
          {/* DHT Sensors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden group hover:border-slate-700 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Thermometer className="h-24 w-24 sm:h-32 sm:w-32 -mt-4 -mr-4 text-emerald-400" />
              </div>
              <h3 className="text-slate-400 text-sm font-medium mb-2 relative z-10">Temperatur (Suhu)</h3>
              <div className="flex items-baseline gap-2 relative z-10">
                <span className="text-5xl sm:text-6xl font-bold text-white tracking-tighter">{sensors.suhu}</span>
                <span className="text-2xl text-indigo-400 font-light">°C</span>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded w-fit relative z-10">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span> Stable
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden group hover:border-slate-700 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Droplets className="h-24 w-24 sm:h-32 sm:w-32 -mt-4 -mr-4 text-blue-400" />
              </div>
              <h3 className="text-slate-400 text-sm font-medium mb-2 relative z-10">Kelembapan</h3>
              <div className="flex items-baseline gap-2 relative z-10">
                <span className="text-5xl sm:text-6xl font-bold text-white tracking-tighter">{sensors.kelembapan}</span>
                <span className="text-2xl text-blue-400 font-light">%</span>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-blue-400 bg-blue-400/10 px-2 py-1 rounded w-fit relative z-10">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.8)]"></span> Realtime
              </div>
            </div>
          </div>

          {/* Voice Assistant */}
          <div className="flex-1 min-h-[240px] bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold rounded uppercase tracking-wider">Voice Assist</span>
                <div className="flex gap-1 opacity-50">
                  <div className="h-1 w-8 bg-indigo-400 rounded-full"></div>
                  <div className="h-1 w-2 bg-indigo-400 rounded-full"></div>
                </div>
              </div>
              
              <div className="min-h-[4rem] flex flex-col justify-end">
                 <p className="text-lg sm:text-xl font-light text-slate-300 leading-relaxed italic transition-all duration-300 border-l-2 border-indigo-500/50 pl-4 py-1">
                   "{voiceLog}"
                 </p>
              </div>
            </div>

            <div className="flex items-center gap-6 mt-8 relative z-10">
              <button 
                onClick={startListening}
                className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 bg-indigo-600 rounded-full flex items-center justify-center border-4 border-slate-950 transition-all duration-300 ${
                  isListening 
                  ? 'bg-red-600 shadow-[0_0_30px_rgba(220,38,38,0.6)] animate-pulse border-red-900/50' 
                  : 'shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:shadow-[0_0_30px_rgba(79,70,229,0.6)] hover:scale-105'
                }`}
              >
                {isListening ? <Loader2 className="h-8 w-8 text-white animate-spin" /> : <Mic className="h-8 w-8 text-white" />}
              </button>
              <div className="flex-1 overflow-hidden">
                <div className="flex gap-1.5 items-end h-8">
                  <div className={`w-1 rounded-t-sm bg-indigo-400 transition-all duration-200 ${isListening ? 'h-3 animate-pulse delay-75' : 'h-1 opacity-30 shadow-[0_0_5px_rgba(129,140,248,0.5)]'}`}></div>
                  <div className={`w-1 rounded-t-sm bg-indigo-400 transition-all duration-200 ${isListening ? 'h-5 animate-pulse delay-100' : 'h-1 opacity-30'}`}></div>
                  <div className={`w-1 rounded-t-sm bg-indigo-400 transition-all duration-200 ${isListening ? 'h-8 animate-pulse delay-150' : 'h-1 opacity-30 shadow-[0_0_5px_rgba(129,140,248,0.5)]'}`}></div>
                  <div className={`w-1 rounded-t-sm bg-indigo-400 transition-all duration-200 ${isListening ? 'h-4 animate-pulse delay-200' : 'h-1 opacity-30'}`}></div>
                  <div className={`w-1 rounded-t-sm bg-indigo-400 transition-all duration-200 ${isListening ? 'h-6 animate-pulse delay-300' : 'h-1 opacity-30'}`}></div>
                  <div className={`w-1 rounded-t-sm bg-indigo-400 transition-all duration-200 ${isListening ? 'h-2 animate-pulse delay-75' : 'h-1 opacity-30 shadow-[0_0_5px_rgba(129,140,248,0.5)]'}`}></div>
                  <div className={`w-1 rounded-t-sm bg-indigo-400 transition-all duration-200 ${isListening ? 'h-7 animate-pulse delay-150' : 'h-1 opacity-30'}`}></div>
                  <div className={`w-1 rounded-t-sm bg-indigo-400 transition-all duration-200 ${isListening ? 'h-4 animate-pulse delay-100' : 'h-1 opacity-30 shadow-[0_0_5px_rgba(129,140,248,0.5)]'}`}></div>
                  <div className={`w-1 rounded-t-sm bg-indigo-400 transition-all duration-200 ${isListening ? 'h-6 animate-pulse delay-75' : 'h-1 opacity-30'}`}></div>
                  <div className={`w-1 rounded-t-sm bg-indigo-400 transition-all duration-200 ${isListening ? 'h-3 animate-pulse delay-300' : 'h-1 opacity-30'}`}></div>
                </div>
                <p className={`text-[10px] uppercase tracking-widest mt-3 font-mono transition-colors ${isListening ? 'text-indigo-300' : 'text-slate-500'}`}>
                  {isListening ? 'Listening for commands...' : 'Microphone Ready'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Relay Control */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Relay Control Panel</h2>
            <button 
             onClick={() => setAllRelays(!relays.r1)} 
             className="text-[10px] font-mono tracking-widest uppercase bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 px-3 rounded text-center transition-colors"
            >
             Toggle All
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3, 4].map((num) => {
               const stateKey = `r${num}` as keyof RelayState;
               const isOn = relays[stateKey];
               return (
                 <div key={num} onClick={() => toggleRelay(num as 1|2|3|4, isOn)} className="cursor-pointer group hover:bg-slate-800 transition-colors bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between shadow-sm">
                   <div className="flex items-center gap-4">
                     <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-inner ${isOn ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-800 text-slate-600 border border-slate-700/50 group-hover:bg-slate-700'}`}>
                        <Power className={`h-5 w-5 ${isOn ? 'drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]' : ''}`} />
                     </div>
                     <div>
                       <div className="flex items-center gap-2 mb-0.5">
                         <p className={`font-bold transition-colors ${isOn ? 'text-white' : 'text-slate-300'}`}>Relay 0{num}</p>
                         {isOn && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_5px_rgba(99,102,241,0.8)]"></span>}
                       </div>
                       <p className="text-xs text-slate-500 font-mono tracking-tight">Channel {num} / GPIO</p>
                     </div>
                   </div>
                   <div className={`w-12 h-6 rounded-full relative transition-colors duration-300 border ${isOn ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-800 border-slate-700'}`}>
                     <div className={`absolute top-[2px] w-4 h-4 rounded-full transition-all duration-300 shadow-sm ${isOn ? 'right-1 bg-white' : 'left-1 bg-slate-400'}`}></div>
                   </div>
                 </div>
               )
            })}
          </div>

          {/* Animations Quick Stats */}
          <div className="mt-auto bg-slate-900 border border-slate-800 rounded-xl py-5 px-6 shadow-sm">
             <div className="flex items-center justify-between mb-4">
               <h2 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Automation Sequences</h2>
               {isAnimating && <span className="text-[10px] font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded animate-pulse">RUNNING</span>}
             </div>
             
             <div className="flex gap-3 mb-5">
                <button 
                  onClick={runAnimation1} 
                  className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-lg transition-colors border ${isAnimating ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-300' : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-indigo-900/40 hover:border-indigo-500/40 hover:text-indigo-300'}`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="text-[10px] font-mono uppercase">Sequence</span>
                </button>
                <button 
                  onClick={runAnimation2} 
                  className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-lg transition-colors border ${isAnimating ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-300' : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-orange-900/40 hover:border-orange-500/40 hover:text-orange-300'}`}
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="text-[10px] font-mono uppercase">Blink All</span>
                </button>
             </div>
             
             {isAnimating && (
               <button 
                  onClick={stopAnimation} 
                  className="w-full text-[10px] font-mono uppercase tracking-widest bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2.5 rounded-lg border border-red-500/30 transition-colors mb-4"
               >
                 HALT SEQUENCE
               </button>
             )}
             
             <div className="flex justify-between text-[10px] font-mono uppercase text-slate-500 mb-2">
                <span>System Health</span>
                <span className="text-slate-300">OPTIMAL</span>
             </div>
             <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-400 h-full rounded-full w-full relative">
                   <div className="absolute top-0 bottom-0 left-0 w-1/3 bg-white/20 skew-x-12 animate-[pulse_2s_linear_infinite]"></div>
                </div>
             </div>
          </div>
        </div>
      </main>

      {/* Footer Status Bar */}
      <footer className="mt-12 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-mono tracking-widest text-slate-600 border-t border-slate-800/60 pt-6 max-w-7xl mx-auto w-full pb-4">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.8)]"></span>
            FIREBASE REALTIME DB ACTIVE
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_4px_rgba(99,102,241,0.8)]"></span>
            CORE SYSTEMS SYNCED
          </div>
        </div>
        <div className="text-center sm:text-right opacity-60">
          SSL ENCRYPTION // AES-256 // DANE-IOT V2
        </div>
      </footer>
    </div>
  );
}
