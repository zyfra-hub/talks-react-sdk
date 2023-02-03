/*
Copyright 2015, 2016 OpenMarket Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { RoomMember } from "matrix-js-sdk/src/models/room-member";
import { User } from "matrix-js-sdk/src/models/user";
import { Room } from "matrix-js-sdk/src/models/room";
import { ResizeMethod } from "matrix-js-sdk/src/@types/partials";
import { split } from "lodash";

import DMRoomMap from "./utils/DMRoomMap";
import { mediaFromMxc } from "./customisations/Media";
import { isLocalRoom } from "./utils/localRoom/isLocalRoom";

const dataUrlFOSDEM = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhLS0gQ3JlYXRlZCB3aXRoIElua3NjYXBlIChodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy8pIC0tPgoKPHN2ZwogICB3aWR0aD0iMjEwbW0iCiAgIGhlaWdodD0iMjEwbW0iCiAgIHZpZXdCb3g9IjAgMCAyMTAgMjEwIgogICB2ZXJzaW9uPSIxLjEiCiAgIGlkPSJzdmc1IgogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxkZWZzCiAgICAgaWQ9ImRlZnMyIiAvPgogIDxnCiAgICAgaWQ9ImxheWVyMSI+CiAgICA8cmVjdAogICAgICAgc3R5bGU9ImZpbGw6I2ZmZmZmZjtzdHJva2U6bm9uZTtzdHJva2Utd2lkdGg6MTU7c3Ryb2tlLWxpbmVjYXA6cm91bmQ7c3Ryb2tlLWxpbmVqb2luOnJvdW5kO3BhaW50LW9yZGVyOm1hcmtlcnMgc3Ryb2tlIGZpbGwiCiAgICAgICBpZD0icmVjdDM5ODQiCiAgICAgICB3aWR0aD0iMjI4Ljc1NDAzIgogICAgICAgaGVpZ2h0PSIyMjUuMDI3MyIKICAgICAgIHg9Ii04Ljk2MDc5NzMiCiAgICAgICB5PSItOC41Mzk0NjIxIiAvPgogICAgPGNpcmNsZQogICAgICAgc3R5bGU9ImZpbGw6I2FiMWI5MztzdHJva2U6bm9uZTtzdHJva2Utd2lkdGg6MTU7c3Ryb2tlLWxpbmVjYXA6cm91bmQ7c3Ryb2tlLWxpbmVqb2luOnJvdW5kO3BhaW50LW9yZGVyOm1hcmtlcnMgc3Ryb2tlIGZpbGwiCiAgICAgICBpZD0icGF0aDExMSIKICAgICAgIGN4PSIxMDUiCiAgICAgICBjeT0iNTEuNDc1ODkxIgogICAgICAgcj0iMzQuNzMzNDc1IiAvPgogICAgPGVsbGlwc2UKICAgICAgIHN0eWxlPSJmaWxsOiNhYjFiOTM7c3Ryb2tlOm5vbmU7c3Ryb2tlLXdpZHRoOjE1O3N0cm9rZS1saW5lY2FwOnJvdW5kO3N0cm9rZS1saW5lam9pbjpyb3VuZDtwYWludC1vcmRlcjptYXJrZXJzIHN0cm9rZSBmaWxsIgogICAgICAgaWQ9InBhdGgyNzAiCiAgICAgICBjeD0iMTA1IgogICAgICAgY3k9IjEyNy4wNDQyNyIKICAgICAgIHJ4PSI1Ni43Mzc4NzMiCiAgICAgICByeT0iNDEuNTYwMTUiIC8+CiAgICA8cmVjdAogICAgICAgc3R5bGU9ImZpbGw6I2FiMWI5MztzdHJva2U6bm9uZTtzdHJva2Utd2lkdGg6MTcuNDkyODtzdHJva2UtbGluZWNhcDpyb3VuZDtzdHJva2UtbGluZWpvaW46cm91bmQ7cGFpbnQtb3JkZXI6bWFya2VycyBzdHJva2UgZmlsbCIKICAgICAgIGlkPSJyZWN0MzI2IgogICAgICAgd2lkdGg9IjExMy41NDk5MSIKICAgICAgIGhlaWdodD0iOTEuMTEwODMyIgogICAgICAgeD0iNDguMjI1MDQ0IgogICAgICAgeT0iMTI3LjAwMDUzIgogICAgICAgcng9IjAiCiAgICAgICByeT0iMCIgLz4KICA8L2c+Cjwvc3ZnPgo=';

// Not to be used for BaseAvatar urls as that has similar default avatar fallback already
export function avatarUrlForMember(
    member: RoomMember,
    width: number,
    height: number,
    resizeMethod: ResizeMethod,
): string {
    let url: string;
    if (member?.getMxcAvatarUrl()) {
        url = mediaFromMxc(member.getMxcAvatarUrl()).getThumbnailOfSourceHttp(width, height, resizeMethod);
    }
    if (!url) {
        // member can be null here currently since on invites, the JS SDK
        // does not have enough info to build a RoomMember object for
        // the inviter.
        url = defaultAvatarUrlForString(member ? member.userId : "");
    }
    return url;
}

export function avatarUrlForUser(
    user: Pick<User, "avatarUrl">,
    width: number,
    height: number,
    resizeMethod?: ResizeMethod,
): string | null {
    if (!user.avatarUrl) return null;
    return mediaFromMxc(user.avatarUrl).getThumbnailOfSourceHttp(width, height, resizeMethod);
}

function isValidHexColor(color: string): boolean {
    return (
        typeof color === "string" &&
        (color.length === 7 || color.length === 9) &&
        color.charAt(0) === "#" &&
        !color
            .slice(1)
            .split("")
            .some((c) => isNaN(parseInt(c, 16)))
    );
}

function urlForColor(color: string): string {
    const size = 40;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    // bail out when using jsdom in unit tests
    if (!ctx) {
        return "";
    }
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, size);
    return canvas.toDataURL();
}

// XXX: Ideally we'd clear this cache when the theme changes
// but since this function is at global scope, it's a bit
// hard to install a listener here, even if there were a clear event to listen to
const colorToDataURLCache = new Map<string, string>();

export function defaultAvatarUrlForString(s: string): string {
    if (!s) return ""; // XXX: should never happen but empirically does by evidence of a rageshake

    return dataUrlFOSDEM;
    
    const defaultColors = ["#0DBD8B", "#368bd6", "#ac3ba8"];
    let total = 0;
    for (let i = 0; i < s.length; ++i) {
        total += s.charCodeAt(i);
    }
    const colorIndex = total % defaultColors.length;
    // overwritten color value in custom themes
    const cssVariable = `--avatar-background-colors_${colorIndex}`;
    const cssValue = document.body.style.getPropertyValue(cssVariable);
    const color = cssValue || defaultColors[colorIndex];
    let dataUrl = colorToDataURLCache.get(color);
    if (!dataUrl) {
        // validate color as this can come from account_data
        // with custom theming
        if (isValidHexColor(color)) {
            dataUrl = urlForColor(color);
            colorToDataURLCache.set(color, dataUrl);
        } else {
            dataUrl = "";
        }
    }
    return dataUrl;
}

/**
 * returns the first (non-sigil) character of 'name',
 * converted to uppercase
 * @param {string} name
 * @return {string} the first letter
 */
export function getInitialLetter(name: string): string {
    if (!name) {
        // XXX: We should find out what causes the name to sometimes be falsy.
        console.trace("`name` argument to `getInitialLetter` not supplied");
        return undefined;
    }
    if (name.length < 1) {
        return undefined;
    }

    const initial = name[0];
    if ((initial === "@" || initial === "#" || initial === "+") && name[1]) {
        name = name.substring(1);
    }

    // rely on the grapheme cluster splitter in lodash so that we don't break apart compound emojis
    return split(name, "", 1)[0].toUpperCase();
}

export function avatarUrlForRoom(
    room: Room,
    width: number,
    height: number,
    resizeMethod?: ResizeMethod,
): string | null {
    if (!room) return null; // null-guard

    if (room.getMxcAvatarUrl()) {
        return mediaFromMxc(room.getMxcAvatarUrl()).getThumbnailOfSourceHttp(width, height, resizeMethod);
    }

    // space rooms cannot be DMs so skip the rest
    if (room.isSpaceRoom()) return null;

    // If the room is not a DM don't fallback to a member avatar
    if (!DMRoomMap.shared().getUserIdForRoomId(room.roomId) && !isLocalRoom(room)) {
        return null;
    }

    // If there are only two members in the DM use the avatar of the other member
    const otherMember = room.getAvatarFallbackMember();
    if (otherMember?.getMxcAvatarUrl()) {
        return mediaFromMxc(otherMember.getMxcAvatarUrl()).getThumbnailOfSourceHttp(width, height, resizeMethod);
    }
    return null;
}
