import { useProjectStore } from '@/stores/projectStore';
import { useTicketStore } from '@/stores/ticketStore';
import { useUserStore } from '@/stores/userStore';
import { useFinancialStore } from '@/stores/financialStore';

export function clearAllStores() {
  useProjectStore.setState({ projects: [], isLoading: false });
  useTicketStore.setState({ tickets: [], responses: [], isLoading: false });
  useUserStore.setState({ users: [], isLoading: false });
  useFinancialStore.setState({
    entries: [],
    isLoading: false,
  });
}
