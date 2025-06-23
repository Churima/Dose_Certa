export function getFrequencyHours(tipoFrequencia: number): number {
  switch (tipoFrequencia) {
    case 0:
      return 8; // A cada 8 horas
    case 1:
      return 6; // A cada 6 horas
    case 2:
      return 12; // A cada 12 horas
    case 3:
      return 24; // A cada 24 horas
    default:
      return 0; // Personalizado
  }
}

export function getFrequencyText(tipoFrequencia: number): string {
  switch (tipoFrequencia) {
    case 0:
      return "A cada 8 horas";
    case 1:
      return "A cada 6 horas";
    case 2:
      return "A cada 12 horas";
    case 3:
      return "A cada 24 horas";
    case 4:
      return "Personalizado";
    default:
      return "Não definido";
  }
}
