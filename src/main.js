import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/api/dialog";

async function readFile(path) {
    return await invoke("read_file", {
        pathStr: path,
    });
}

async function getTracks() {
    return await invoke("get_tracks");
}

async function deleteTrack(id) {
    return await invoke("delete_track", { id });
}

async function buildTrackList() {
    let tracks = await getTracks();
    let tasksContainer = document.querySelector("#tracks");
    tasksContainer.innerHTML = "";

    tracks.forEach((track) => {
        let div = document.createElement("div");
        div.classList.add("track-wrapper");

        div.innerHTML = `
            <label>
                <span>${track.title}</span>
            </label>

            <button class="delete" data-id="${track.id}">
                delete
            </button>
        `;

        tasksContainer.appendChild(div);
    });

    document.querySelectorAll(".delete").forEach((el) => {
        el.addEventListener("click", async (event) => {
            let id = parseInt(event.target.dataset.id);

            await deleteTrack(id);
            await buildTrackList();
        });
    });
}

window.addEventListener("DOMContentLoaded", () => {
    buildTrackList();

    document.querySelector("#add-track").addEventListener("click", (event) => {
        event.preventDefault();

        open({
            title: "Select a file",
            multiple: false,
        }).then((res) => {
            readFile(res).then(() => {
                buildTrackList();
            });
        });
    });
});
