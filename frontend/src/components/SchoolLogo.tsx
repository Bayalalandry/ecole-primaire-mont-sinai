import logo from '../assets/logo_ecole_primaire_le_mont_sinai_app.png';

interface SchoolLogoProps {
  size?: number;
  className?: string;
  inCircle?: boolean;
}

export default function SchoolLogo({ size = 32, className = '', inCircle = true }: SchoolLogoProps) {
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
        <img 
          src={logo} 
          alt="Logo de l'école" 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            display: 'block',
            padding: 0,
            margin: 0
          }} 
        />
      </div>
    );
  }
  
  return (
    <img 
      src={logo} 
      alt="Logo de l'école" 
      className={className} 
      style={{ width: size, height: size, objectFit: 'contain' }} 
    />
  );
}
