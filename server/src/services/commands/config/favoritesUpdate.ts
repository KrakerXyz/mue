import { FavoritesUpdateCommand } from '@core/commands/configCommands';
import { Handler } from '..';

export const favoritesUpdateHandler: Handler<FavoritesUpdateCommand> = (cmd, services) => {
   return services.config.favorites.update(cmd.favorites);
};