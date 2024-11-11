import * as alt from "alt-server";
import vehicleHandler from '../../chat/server/vehicleHandler.js';
import spawnHandler from '../../chat/server/spawnHandler.js';

const spawnModels = ["u_m_y_mani", "csb_mweather", "hc_driver", "mp_m_weapexp_01"];

function randomNumber(min, max) {
  return Math.round(Math.random() * (max - min) + min);
}

function getRandomListEntry(list) {
  return randomNumber(0, list.length - 1);
}

alt.on("playerConnect", (player) => {
  if (player.name.includes("admin")) {
    player.kick();
    return;
  }

  player.model = spawnModels[getRandomListEntry(spawnModels)];
  player.setMeta("vehicles", []);
  spawnHandler.spawnPlayer(player);
  alt.emitClient(player, "freeroam:spawned");
  alt.emitClient(player, "freeroam:Interiors");

  let connectTimeout = alt.setTimeout(() => {
    if (player && player.valid) {
      const playerCount = alt.Player.all.length;
      alt.emitAllClients('addMessage', `${player.name} has joined the Server.. (${playerCount} players online)`, 'system');
      alt.emitClient(player, 'addMessage', "Press T and type /help to see all available commands..", 'info');
    }
    alt.clearTimeout(connectTimeout);
  }, 1000);
});

alt.on("playerDisconnect", (player, reason) => {
  const playerCount = alt.Player.all.length;
  alt.emitAllClients('addMessage', `${player.name} has left the Server.. (${playerCount} players online)`, 'system');
  
  vehicleHandler.cleanupPlayerVehicles(player);
  
  alt.log(`${player.name} has left the server because of ${reason}`);
});
