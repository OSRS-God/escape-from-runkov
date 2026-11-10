// The starter kits (version 127): a new character picks one of three, one a
// combat style, in place of the guild's old bronze sword, leather body and
// shrimps. Each is that style's tier 1 gear, matched (bronze, leather, blue
// wizard), with food, and the arrows or runes its weapon needs.
import { removeItem } from "./inventory";
import { Equipment, ItemStack, SaveData } from "./save";

export type StarterKit = {
    style: "melee" | "ranged" | "magic" | "slayer";
    name: string;
    blurb: string;
    equipment: Equipment;
    backpack: ItemStack[];
    // Only offered for the Depths' fresh start (version 162)
    depths?: boolean;
};

const SHRIMPS = 315;

export const STARTER_KITS: StarterKit[] = [
    {
        style: "melee",
        name: "Squire",
        blurb: "Bronze armour and a longsword. Takes hits well and needs nothing else: the safest way to learn the maps.",
        equipment: { weapon: 1291, head: 1139, body: 1103, legs: 1087, shield: 1171 },
        backpack: [{ id: SHRIMPS, count: 10 }],
    },
    {
        style: "ranged",
        name: "Archer",
        blurb: "A shortbow, 100 bronze arrows and leather. Hits from range, but the armour's light and the arrows run out.",
        equipment: { weapon: 841, head: 1167, body: 1129, legs: 1095, hands: 1063 },
        backpack: [
            { id: 882, count: 100 },
            { id: SHRIMPS, count: 8 },
        ],
    },
    {
        style: "magic",
        name: "Apprentice",
        blurb: "A staff of air (its air runes are free, so Wind Strike costs a mind rune), 150 mind runes and blue wizard robes. The longest reach, the weakest armour.",
        equipment: { weapon: 1381, head: 579, body: 577, legs: 1011 },
        backpack: [
            { id: 558, count: 150 },
            { id: SHRIMPS, count: 8 },
        ],
    },
    // The Depths' own class (version 162, as the user asked): built for the
    // dark rather than the fight. Iron knives to throw and an iron longsword
    // in the pack for when they close in, a spiny helmet and slayer gloves
    // over leather (the lightest armour of the four), and the most light:
    // five more cans of oil on the three every Depths start gets, a full
    // pack's fifteen shrimps (the user asked: six at first) and a prayer
    // potion
    {
        style: "slayer",
        name: "Delver",
        blurb: "The Depths' own: iron knives to throw and a longsword for when they close in, a spiny helmet and slayer gloves over leather, and supplies to spare: eight cans of oil, fifteen shrimps and a prayer potion. The lightest armour of the four.",
        equipment: { weapon: 863, head: 4551, body: 1129, legs: 1095, hands: 6720, feet: 1061 },
        backpack: [
            { id: 863, count: 150 },
            { id: 1293, count: 1 },
            { id: SHRIMPS, count: 15 },
            { id: 2434, count: 1 },
            { id: 277, count: 5 },
        ],
        depths: true,
    },
];

// The old kit newSave() still makes, swapped for the one picked
const OLD_STASHED = 1129;

// The Depths' fresh start also gets a bullseye lantern and a few cans of
// oil for it (version 161): the dark there is the darkest in the game
const LANTERN = 4550;
const OIL = 277;
const DEPTHS_OIL = 3;

export function applyStarter(save: SaveData, kit: StarterKit): void {
    removeItem(save.stash, OLD_STASHED, 1);
    save.equipment = { ...kit.equipment };
    save.backpack = kit.backpack.map((s) => ({ ...s }));
    // (the Forgotten Castle's too, as dark: version 163)
    if (save.mode === "endless" || save.mode === "castle") {
        save.backpack.push({ id: LANTERN, count: 1 });
        const oil = save.backpack.find((s) => s.id === OIL);
        if (oil) {
            oil.count += DEPTHS_OIL;
        } else {
            save.backpack.push({ id: OIL, count: DEPTHS_OIL });
        }
    }
    delete save.pickStarter;
}
