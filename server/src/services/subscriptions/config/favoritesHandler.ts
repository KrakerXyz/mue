import { FavoritesUpdateCommand } from '../../../../../core/commands/index.js';
import { defaultFavorites } from '../../../../../core/models/index.js';
import { FavoritesData, FavoritesSubscription } from '../../../../../core/subscriptions/index.js';
import Observable from 'zen-observable';
import { OnceHandler } from '../index.js';

export const favoritesHandler: OnceHandler<FavoritesSubscription> = (_, services) => {
   return new Observable<FavoritesData>((sub) => {
      let disposed = false;
      services.config.favorites.get().then((x) => {
         if (disposed) {
            return;
         }

         if (!x) {
            sub.next(defaultFavorites);
            return;
         }

         sub.next(x);
      });

      const onUpdate = (data: FavoritesUpdateCommand) => {
         if (disposed) {
            return;
         }
         sub.next(data.favorites);
      };
      services.commandEvents.addListener('command.config.favorites.update', onUpdate);

      return () => {
         sub.complete();
         disposed = true;
         services.commandEvents.removeListener('command.config.favorites.update', onUpdate);
      };
   });
};
