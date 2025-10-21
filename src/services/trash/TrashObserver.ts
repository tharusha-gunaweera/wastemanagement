import { TrashItem, TrashStats } from '../../models/User';

export interface TrashObserver {
  onTrashAdded(trashItem: TrashItem): void;
  onTrashDeleted(trashId: string): void;
  onTrashStatsUpdated(stats: TrashStats): void;
}