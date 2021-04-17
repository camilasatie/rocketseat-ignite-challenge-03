import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

export function formatDate(date: string): string {
  const formattedDate = format(new Date(date), 'dd MMM yyyy', {
    locale: ptBR,
  });

  return formattedDate;
}
