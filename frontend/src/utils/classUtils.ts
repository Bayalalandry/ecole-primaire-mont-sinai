// Ordre standard des classes du primaire
const CLASS_ORDER = ['CP1', 'CP2', 'CE1', 'CE2', 'CM1', 'CM2'];

export function sortClasses(classes: any[]): any[] {
  return classes.sort((a, b) => {
    const orderA = CLASS_ORDER.indexOf(a.name.toUpperCase());
    const orderB = CLASS_ORDER.indexOf(b.name.toUpperCase());
    
    // Si les deux sont dans l'ordre standard, utiliser cet ordre
    if (orderA !== -1 && orderB !== -1) {
      return orderA - orderB;
    }
    
    // Si seul le premier est dans l'ordre standard, il vient en premier
    if (orderA !== -1) return -1;
    if (orderB !== -1) return 1;
    
    // Sinon, ordre alphabétique
    return a.name.localeCompare(b.name);
  });
}

export function getOrderedClassNames(classNames: string[]): string[] {
  return classNames.sort((a, b) => {
    const orderA = CLASS_ORDER.indexOf(a.toUpperCase());
    const orderB = CLASS_ORDER.indexOf(b.toUpperCase());
    
    if (orderA !== -1 && orderB !== -1) {
      return orderA - orderB;
    }
    
    if (orderA !== -1) return -1;
    if (orderB !== -1) return 1;
    
    return a.localeCompare(b);
  });
}
