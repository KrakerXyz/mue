import { FavoritesUpdateCommand } from '../../../../../core/commands/configCommands.js';
import { Handler } from '../index.js';

export const favoritesUpdateHandler: Handler<FavoritesUpdateCommand> = (cmd, services) => {
   return services.config.favorites.update(cmd.favorites);
};
