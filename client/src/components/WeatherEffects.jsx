import React, { useEffect, useRef } from 'react';
import { useWeather } from '@/contexts/WeatherContext';

const WeatherEffects = () => {
  const { weather } = useWeather();
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!weather) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    const particles = [];
    const particleCount = weather.main === 'Rain' ? 100 : weather.main === 'Snow' ? 50 : 0;

    class Particle {
      constructor() {
        this.init();
      }

      init() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height - canvas.height;
        this.length = Math.random() * 20 + 10;
        this.speed = Math.random() * 10 + 5;
        this.opacity = Math.random() * 0.5;
        this.size = Math.random() * 3 + 1;
        this.wind = Math.random() * 2 - 1;
      }

      draw() {
        if (weather.main === 'Rain') {
          ctx.strokeStyle = `rgba(174, 194, 224, ${this.opacity})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(this.x, this.y);
          ctx.lineTo(this.x + this.wind, this.y + this.length);
          ctx.stroke();
        } else if (weather.main === 'Snow') {
          ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      update() {
        this.y += this.speed;
        this.x += this.wind;

        if (this.y > canvas.height) {
          this.init();
          this.y = -20;
        }
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.draw();
        p.update();
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    if (particleCount > 0) {
      animate();
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [weather]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[100]"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

export default WeatherEffects;
