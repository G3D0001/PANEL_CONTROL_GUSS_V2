import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, Eye, EyeOff, LogIn, User, AlertCircle, Loader2, Database, KeyRound, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function Login() {
  const { loginLocal, signInLocal } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para sincronización moderna de Supabase
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncMessage, setSyncMessage] = useState('Iniciando sesión...');
  const [sessionToActivate, setSessionToActivate] = useState<any | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const gridSize = 45;
    const linesCount = 24;
    const speed = 1.5;

    class NeonLine {
      x: number;
      y: number;
      dirX: number;
      dirY: number;
      color: string;
      length: number;
      history: { x: number; y: number }[];
      hue: number;

      constructor() {
        this.reset();
        this.hue = Math.random() * 360;
      }

      reset() {
        this.x = Math.floor(Math.random() * (width / gridSize)) * gridSize;
        this.y = Math.floor(Math.random() * (height / gridSize)) * gridSize;
        const dirs = [
          { x: 1, y: 0 },
          { x: -1, y: 0 },
          { x: 0, y: 1 },
          { x: 0, y: -1 }
        ];
        const chosenDir = dirs[Math.floor(Math.random() * dirs.length)];
        this.dirX = chosenDir.x;
        this.dirY = chosenDir.y;
        this.length = Math.floor(Math.random() * 12) + 8;
        this.history = [];
        this.hue = Math.random() * 360;
      }

      update() {
        this.history.push({ x: this.x, y: this.y });
        if (this.history.length > this.length) {
          this.history.shift();
        }

        this.x += this.dirX * speed;
        this.y += this.dirY * speed;

        if (Math.floor(this.x) % gridSize === 0 && Math.floor(this.y) % gridSize === 0) {
          if (Math.random() < 0.3) {
            const currentDir = { x: this.dirX, y: this.dirY };
            const nextDirs = [
              { x: 1, y: 0 },
              { x: -1, y: 0 },
              { x: 0, y: 1 },
              { x: 0, y: -1 }
            ].filter(d => !(d.x === -currentDir.x && d.y === -currentDir.y));

            const newDir = nextDirs[Math.floor(Math.random() * nextDirs.length)];
            this.dirX = newDir.x;
            this.dirY = newDir.y;
          }
        }

        this.hue = (this.hue + 0.8) % 360;

        if (this.x < -gridSize * 2 || this.x > width + gridSize * 2 || this.y < -gridSize * 2 || this.y > height + gridSize * 2) {
          this.reset();
        }
      }

      draw(c: CanvasRenderingContext2D) {
        if (this.history.length < 2) return;
        c.beginPath();
        c.moveTo(this.history[0].x, this.history[0].y);
        for (let i = 1; i < this.history.length; i++) {
          c.lineTo(this.history[i].x, this.history[i].y);
        }
        
        c.strokeStyle = `hsla(${this.hue}, 100%, 60%, 0.85)`;
        c.lineWidth = 4;
        c.shadowBlur = 12;
        c.shadowColor = `hsla(${this.hue}, 100%, 60%, 1)`;
        c.lineCap = 'round';
        c.stroke();

        c.beginPath();
        c.moveTo(this.history[0].x, this.history[0].y);
        for (let i = 1; i < this.history.length; i++) {
          c.lineTo(this.history[i].x, this.history[i].y);
        }
        c.strokeStyle = '#ffffff';
        c.lineWidth = 1.5;
        c.shadowBlur = 0;
        c.stroke();
      }
    }

    const neonLines: NeonLine[] = [];
    for (let i = 0; i < linesCount; i++) {
      neonLines.push(new NeonLine());
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(2, 6, 23, 0.15)';
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(30, 41, 59, 0.25)';
      ctx.lineWidth = 1;
      ctx.shadowBlur = 0;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      neonLines.forEach((line) => {
        line.update();
        line.draw(ctx);
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  useEffect(() => {
    if (!isSyncing) return;

    const interval = setInterval(() => {
      setSyncProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const increment = Math.floor(Math.random() * 6) + 4;
        const next = Math.min(prev + increment, 100);

        if (next < 25) {
          setSyncMessage('Verificando credenciales en tabla "perfiles_locales"...');
        } else if (next < 50) {
          setSyncMessage('Conexión encriptada con Supabase exitosa...');
        } else if (next < 75) {
          setSyncMessage('Sincronizando perfil, CUIT, WhatsApp y logos...');
        } else if (next < 92) {
          setSyncMessage('Asignando privilegios de seguridad y políticas RLS...');
        } else {
          setSyncMessage('Inicializando panel de control...');
        }

        return next;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [isSyncing]);

  useEffect(() => {
    if (syncProgress === 100 && sessionToActivate) {
      const timeout = setTimeout(() => {
        signInLocal(sessionToActivate);
      }, 700);
      return () => clearTimeout(timeout);
    }
  }, [syncProgress, sessionToActivate, signInLocal]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    setError(null);

    try {
      const res = await loginLocal(username, password, true);
      if (res.success && res.sessionData) {
        setSessionToActivate(res.sessionData);
        setIsSyncing(true);
      } else {
        setError(res.error || 'Credenciales de acceso incorrectas.');
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Fondo tecnológico de líneas de neón led píxel */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* Orbes de fondo estéticos y fluidos */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 dark:opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[130px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 dark:bg-blue-600/5 rounded-full blur-[130px] animate-pulse" style={{ animationDuration: '12s' }} />
      </div>

      <AnimatePresence mode="wait">
        {!isSyncing ? (
          <motion.div
            key="login-form"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="max-w-md w-full bg-slate-900/90 backdrop-blur-md rounded-3xl shadow-2xl p-10 border border-slate-800 text-center space-y-8 relative z-10"
          >
            <div className="flex justify-center">
              <div className="size-16 bg-slate-950 rounded-2xl flex items-center justify-center text-white shadow-xl relative group overflow-hidden border border-slate-800">
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <ShieldCheck size={32} className="text-emerald-400 z-10" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-white tracking-tight uppercase">Panel de Control</h1>
            </div>

            <div className="space-y-6">
              <form onSubmit={handleAuth} className="space-y-4">
                <div className="relative group">
                  <input
                    id="username-input"
                    type="text"
                    placeholder="Usuario / Correo Electrónico"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold focus:ring-4 focus:ring-slate-900/10 focus:border-slate-950 dark:focus:border-slate-700 outline-none dark:text-white transition-all"
                  />
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-700 dark:group-focus-within:text-white transition-colors" size={18} />
                </div>

                <div className="relative group">
                  <input
                    id="password-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="Contraseña de Acceso"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold focus:ring-4 focus:ring-slate-900/10 focus:border-slate-950 dark:focus:border-slate-700 outline-none dark:text-white transition-all"
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-700 dark:group-focus-within:text-white transition-colors" size={18} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <button
                  id="login-submit-button"
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-950 hover:bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white shadow-sm py-4 rounded-xl font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : (
                    <>Ingresar al Panel <LogIn size={16} /></>
                  )}
                </button>
              </form>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/60 p-4 rounded-2xl flex items-start gap-3 text-left"
              >
                <AlertCircle className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" size={16} />
                <p className="text-[11px] font-bold text-rose-700 dark:text-rose-300 leading-normal">{error}</p>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="syncing-loader"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-10 border border-slate-200/80 dark:border-slate-800/60 text-center space-y-10 relative z-10 flex flex-col items-center"
          >
            {/* Animación del Spinner e Ícono Central de Supabase */}
            <div className="relative size-24 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                className="absolute inset-0 border-4 border-slate-100 dark:border-slate-800 border-t-emerald-500 dark:border-t-emerald-400 border-r-blue-500 rounded-full"
              />
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                className="size-14 bg-slate-950 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-white shadow-md"
              >
                <Database size={24} className="text-emerald-400" />
              </motion.div>
            </div>

            {/* Texto y Porcentaje Principal */}
            <div className="space-y-3 w-full">
              <div className="flex justify-center items-baseline gap-1 text-slate-900 dark:text-white">
                <span className="text-4xl font-extrabold tracking-tight font-mono">{syncProgress}</span>
                <span className="text-lg font-bold text-slate-400 font-mono">%</span>
              </div>
              <p className="text-xs font-black uppercase tracking-[0.15em] text-emerald-500 dark:text-emerald-400">
                Sincronizando Sistema
              </p>
              <div className="h-6 flex items-center justify-center">
                <motion.p 
                  key={syncMessage}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs font-bold text-slate-600 dark:text-slate-300 tracking-wide text-center"
                >
                  {syncMessage}
                </motion.p>
              </div>
            </div>

            {/* Barra de Progreso Avanzada con Reflejo */}
            <div className="w-full space-y-2">
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-[2px] border border-slate-200/40 dark:border-slate-700/40">
                <motion.div 
                  className="bg-gradient-to-r from-emerald-500 to-blue-500 h-full rounded-full relative"
                  initial={{ width: '0%' }}
                  animate={{ width: `${syncProgress}%` }}
                  transition={{ ease: 'easeOut', duration: 0.1 }}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] w-20 animate-pulse h-full" style={{ left: '10%' }} />
                </motion.div>
              </div>
              <div className="flex justify-between items-center text-[9px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-1">
                <span className="flex items-center gap-1"><KeyRound size={10} /> Conexión SSL</span>
                <span>Estable</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
