import { useRef, useEffect, useCallback } from 'react';
import './Particles.css';

const Particles = ({
  particleColors = ['#ffffff'],
  particleCount = 100,
  particleSpread = 10,
  speed = 1,
  particleBaseSize = 1,
  moveParticlesOnHover = false,
  alphaParticles = true,
  disableRotation = false,
  pixelRatio = 1,
  className = ''
}) => {
  const canvasRef = useRef(null);
  const particles = useRef([]);
  const mousePos = useRef({ x: -1000, y: -1000 });
  const animationId = useRef(null);
  const containerRef = useRef(null);

  const initParticles = useCallback((width, height) => {
    const particlesArr = [];
    const color = particleColors[Math.floor(Math.random() * particleColors.length)];

    for (let i = 0; i < particleCount; i++) {
      particlesArr.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        size: (Math.random() * 0.5 + 0.5) * particleBaseSize,
        color: color,
        alpha: Math.random(),
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * (disableRotation ? 0 : 1)
      });
    }
    particles.current = particlesArr;
  }, [particleColors, particleCount, speed, particleBaseSize, disableRotation]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const resize = () => {
      const width = canvas.parentElement?.offsetWidth || window.innerWidth;
      const height = canvas.parentElement?.offsetHeight || window.innerHeight;
      canvas.width = width * pixelRatio;
      canvas.height = height * pixelRatio;
      ctx.scale(pixelRatio, pixelRatio);
      initParticles(width, height);
    };

    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mousePos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    const handleMouseLeave = () => {
      mousePos.current = { x: -1000, y: -1000 };
    };

    if (moveParticlesOnHover) {
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseleave', handleMouseLeave);
    }

    const animate = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;

      ctx.clearRect(0, 0, width, height);

      particles.current.forEach(particle => {
        if (moveParticlesOnHover && mousePos.current.x !== -1000) {
          const dx = mousePos.current.x - particle.x;
          const dy = mousePos.current.y - particle.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 100;

          if (dist < maxDist) {
            const force = (maxDist - dist) / maxDist;
            particle.vx -= (dx / dist) * force * 0.5;
            particle.vy -= (dy / dist) * force * 0.5;
          }
        }

        particle.x += particle.vx * speed;
        particle.y += particle.vy * speed;
        
        if (!disableRotation) {
          particle.rotation += particle.rotationSpeed;
        }

        if (particle.x < 0) particle.x = width;
        if (particle.x > width) particle.x = 0;
        if (particle.y < 0) particle.y = height;
        if (particle.y > height) particle.y = 0;

        let alpha = alphaParticles ? particle.alpha : 1;
        
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate((particle.rotation * Math.PI) / 180);
        
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        
        ctx.beginPath();
        ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      });

      animationId.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (moveParticlesOnHover) {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseleave', handleMouseLeave);
      }
      cancelAnimationFrame(animationId.current);
    };
  }, [particleColors, particleCount, speed, particleBaseSize, moveParticlesOnHover, alphaParticles, disableRotation, pixelRatio, initParticles]);

  return (
    <div ref={containerRef} className={`particles-container ${className}`}>
      <canvas ref={canvasRef} className="particles-canvas"></canvas>
    </div>
  );
};

export default Particles;
