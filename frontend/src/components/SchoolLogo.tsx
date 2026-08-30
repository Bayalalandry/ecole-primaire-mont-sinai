import logoWebP from '../assets/logo_ecole_primaire_le_mont_sinai_app.webp';
import logoPNG from '../assets/logo_ecole_primaire_le_mont_sinai_app.png';

interface SchoolLogoProps {
  size?: number;
  className?: string;
  inCircle?: boolean;
}

export default function SchoolLogo({ size = 32, className = '', inCircle = true }: SchoolLogoProps) {
  const imgContent = (
    <picture>
      <source srcSet={logoWebP} type="image/webp" />
      <img
        src={logoPNG}
        alt="Logo de l'école"
        style={{
          width: '100%',
          height: '100%',
          objectFit: inCircle ? 'cover' : 'contain',
          display: 'block',
          padding: 0,
          margin: 0
        }}
      />
    </picture>
  );

  if (inCircle) {
    return (
      <div
        className={className}
        style={{
          width: size,
          height: size,
          backgroundColor: 'white',
          borderRadius: '50%',
          overflow: 'hidden',
          padding: 0,
          margin: 0,
          display: 'block'
        }}
      >
        {imgContent}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{ width: size, height: size }}
    >
      {imgContent}
    </div>
  );
}
