import { logConsole as _logConsole } from './ui.js';

let _logContainerId = null;

export function setLogContainer(containerId) {
    _logContainerId = containerId;
}

export function resetLogContainer() {
    _logContainerId = null;
}

function logConsole(msg, type) {
    _logConsole(msg, type, undefined, _logContainerId || undefined);
}

// =============================================
// 📢 NARRATOR — Capa de formato narrativa premium
//   Texto estilo Pokémon para el log de combate.
//   engine.js llama a estas funciones sin saber
//   cómo se formatea el mensaje.
// =============================================

export function narrateUltimateMultiplier(atkName, ultName, rawDmg) {
    logConsole(`🔥 ${atkName} desata ${ultName} — poder devastador de ${rawDmg}!`, 'passive');
}

export function narrateUltimateHeal(atkName, ultName, heal) {
    logConsole(`💚 ${atkName} canaliza ${ultName} y recupera ${heal} HP con energía mística!`, 'passive');
}

export function narrateUltimateSteal(atkName, ultName, stolenAtq, stolenDef) {
    logConsole(`👻 ${atkName} invoca ${ultName} — drena ${stolenAtq} ATQ y ${stolenDef} DEF del enemigo!`, 'passive');
}

export function narrateUltimateShield(atkName, ultName, shield) {
    logConsole(`🛡️ ${atkName} erige ${ultName} — absorbe ${shield} de daño con su escudo!`, 'passive');
}

export function narrateUltimatePoison(defName, ultName, turns) {
    logConsole(`☠️ ${defName} es alcanzado por ${ultName} — queda envenenado por ${turns} turnos!`, 'passive');
}

export function narrateAntiArmor(atkName, rawDmg) {
    logConsole(`🎯 ${atkName} aprovecha las grietas en la armadura — el daño se eleva a ${rawDmg}!`, 'passive');
}

export function narrateDragonSlayer(atkName, defName) {
    logConsole(`🐉 ${atkName} activa su odio ancestral — perfora el 50% de la defensa de ${defName}!`, 'passive');
}

export function narrateLightningRod(defName, reduced, atkName) {
    logConsole(`⚡ ${defName} desvía la electricidad con su escudo elemental — reduce ${reduced} ATK de ${atkName}!`, 'passive');
}

export function narrateRevive(defName, hp) {
    logConsole(`✨ ${defName} se niega a caer — un destello divino lo restaura con ${hp} HP!`, 'passive');
}

export function narrateBlockHeal(defName, healAmt) {
    logConsole(`🛡️ ${defName} levanta su Velo Sagrado — el ataque es inútil y recupera ${healAmt} HP!`, 'passive');
}

export function narrateWarlordBlock(defName, healAmt) {
    logConsole(`🛡️ ${defName} alza su Baluarte de Guerra — el golpe rebota y restaura ${healAmt} HP!`, 'passive');
}

export function narrateReflectFull(receiverName, reflectedDmg, attackerName) {
    logConsole(`🪞 ${receiverName} devuelve el daño con su Espejo Roto — ${reflectedDmg} de impacto propio a ${attackerName}!`, 'passive');
}

export function narrateThornArmor(receiverName, reflected, attackerName) {
    logConsole(`🌵 Las espinas de ${receiverName} hieren a ${attackerName} — causa ${reflected} de daño reflejado!`, 'passive');
}

export function narrateIronSkin(receiverName, converted) {
    logConsole(`🛡️ ${receiverName} endurece su Piel de Acero — convierte ${converted} del daño en defensa adicional!`, 'passive');
}

export function narrateLeechAbsorb(receiverName, healed) {
    logConsole(`🧛 ${receiverName} absorbe la energía del impacto — recupera ${healed} HP con su vampirismo!`, 'passive');
}

export function narrateAttack(aName, dName) {
    logConsole(`⚔️ ${aName} ataca ferozmente a ${dName}!`, 'attack');
}

export function narrateArmorPiercing(aName, piercing) {
    logConsole(`💉 ${aName} clava su ataque perforante — ${piercing} de daño directo al HP de su oponente!`, 'passive');
}

export function narrateDamageSummary(dName, hpDamage, defDamage) {
    let line = `💥 ${dName} recibe el impacto`;
    if (hpDamage > 0 && defDamage > 0) {
        line += ` — pierde ${hpDamage} HP y ${defDamage} de armadura!`;
    } else if (hpDamage > 0) {
        line += ` — sufre ${hpDamage} de daño directo!`;
    } else if (defDamage > 0) {
        line += ` — su armadura se resquebraja (-${defDamage} DEF)!`;
    } else {
        line += ` — pero el daño es insignificante!`;
    }
    logConsole(line, 'damage');
}

export function narrateUltimateActivation(aName, ultName) {
    logConsole(`🔥 ¡${aName} desata ${ultName || 'su ULTIMATE'} con poder arrollador!`, 'victory');
}

export function narrateFervorMax(fighterName) {
    logConsole(`🔥 ¡${fighterName} arde con FERVOR AL MÁXIMO — su poder está listo para desatarse!`, 'victory');
}

export function narratePoisonDamage(actorName, poisonDmg) {
    logConsole(`☠️ ${actorName} sufre ${poisonDmg} de daño por el veneno corrosivo!`, 'passive');
}

export function narrateDeath(targetName) {
    logConsole(`💀 ¡${targetName} ha caído en combate!`, 'victory');
}

export function narrateDraw() {
    logConsole('⚖️ ¡AMBOS COMBATIENTES YACEN SIN FUERZAS — ES UN EMPATE ABSOLUTO!', 'victory');
}

export function narrateVictory(winnerName, hp) {
    logConsole(`🏆 ¡${winnerName} se alza VICTORIOSO con ${hp} HP restantes!`, 'victory');
}

export function narrateSacredVeilReady(fName) {
    logConsole(`🛡️ ${fName} envuelve su cuerpo en el Velo Sagrado — preparado para bloquear el próximo golpe.`, 'passive');
}

export function narrateBrokenMirrorReady(fName) {
    logConsole(`🪞 ${fName} activa el Escudo Reflectante — el próximo ataque se volverá contra su dueño.`, 'passive');
}

export function narrateSoulThief(fName, stolenAtq, stolenDef, rName) {
    logConsole(`👻 ${fName} drena la esencia de ${rName} — roba ${stolenAtq} ATQ y ${stolenDef} DEF con su robo de almas!`, 'passive');
}

export function narrateXenophobia(fName, atkBoost, defBoost) {
    logConsole(`👁️ ${fName} arde en xenofobia — su odio aumenta su poder en +${atkBoost} ATQ y +${defBoost} DEF contra el no-humano!`, 'passive');
}

export function narrateDragonSlayerReady(fName) {
    logConsole(`🐉 ${fName} se prepara para la caza — su instinto asesino busca dragones.`, 'passive');
}

export function narrateLightningRodReady(fName) {
    logConsole(`⚡ ${fName} canaliza energía elemental — su protección contra rayos está activa.`, 'passive');
}

export function narrateGrowth(fName) {
    logConsole(`📈 ${fName} crece con cada golpe — sus stats aumentan un 10%!`, 'passive');
}

export function narrateVenom(fName, rName, venomDmg) {
    logConsole(`☠️ El veneno de ${fName} corroe a ${rName} — causa ${venomDmg} de daño!`, 'passive');
}

export function narrateRust(fName, drain, rName) {
    logConsole(`⚙️ ${fName} oxida la armadura de ${rName} — corroe ${drain} DEF!`, 'passive');
}

export function narrateDoubleStrike(fName) {
    logConsole(`⚡ ¡${fName} ataca con un doble golpe relámpago!`, 'passive');
}

export function narrateLeechDrain(fName, steal) {
    logConsole(`🧛 ${fName} absorbe la fuerza vital de su víctima — drena ${steal} HP!`, 'passive');
}

export function narrateShieldRecharge(fName, regen) {
    logConsole(`🛡️ ${fName} recarga su escudo mágico — regenera ${regen} de defensa!`, 'passive');
}

export function narrateGracefulStrikeReady(fName) {
    logConsole(`✨ ${fName} protege su esencia vital — el Golpe Grácil está listo para evitar la muerte.`, 'passive');
}

export function narrateBerserker(fName) {
    logConsole(`🔥 ${fName} enloquece de ira — su fuerza se TRIPLICA en un frenesí berserker!`, 'passive');
}

export function narrateLastStand(fName) {
    logConsole(`🏛️ ${fName} planta cara a la muerte — su defensa se CUADRIPLICA en su Último Bastión!`, 'passive');
}

export function narrateWarlordRegen(fName, regen) {
    logConsole(`🩸 ${fName} se regenera con vitalidad de señor de la guerra — recupera ${regen} HP!`, 'passive');
}

export function narrateBerserkerFury(fName) {
    logConsole(`🔥 ¡${fName} desata su Furia Berserker — su ataque se TRIPLICA!`, 'passive');
}

export function narrateAntimatterReady(fName) {
    logConsole(`☠️ ${fName} tiene el núcleo de antimateria inestable — detonará al morir!`, 'passive');
}

export function narrateAntimatterDetonation(defName, atkName, dmg) {
    logConsole(`💥 ¡${defName} detona su núcleo de antimateria al morir — ${atkName} recibe ${dmg} de daño!`, 'passive');
}
