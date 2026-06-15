import { OBSWebSocket } from "obs-websocket-js";
import { MORPHIX_INPUT_NAME, MORPHIX_SCENE_NAME, OBS_WS_URL, OUTPUT_WINDOW_TITLE } from "../config.js";
import { getObsPassword } from "../settings.js";

export interface ObsStatus {
  connected: boolean;
  virtualCamActive: boolean;
  sceneReady: boolean;
  error?: string;
}

export class ObsVirtualCamService {
  private obs = new OBSWebSocket();
  private connected = false;

  async connect(): Promise<void> {
    if (this.connected) return;
    const password = await getObsPassword();
    try {
      await this.obs.connect(OBS_WS_URL, password ?? undefined);
      this.connected = true;
    } catch (err) {
      this.connected = false;
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(
        `Could not connect to OBS WebSocket at ${OBS_WS_URL}. Is OBS Studio running with WebSocket enabled? ${message}`
      );
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connected) return;
    try {
      await this.obs.disconnect();
    } catch {
      /* ignore */
    }
    this.connected = false;
  }

  async getStatus(): Promise<ObsStatus> {
    try {
      await this.connect();
      const virtualCam = await this.obs.call("GetVirtualCamStatus");
      const scenes = await this.obs.call("GetSceneList");
      const sceneReady = scenes.scenes.some((s) => s.sceneName === MORPHIX_SCENE_NAME);
      return {
        connected: true,
        virtualCamActive: virtualCam.outputActive,
        sceneReady,
      };
    } catch (err) {
      return {
        connected: false,
        virtualCamActive: false,
        sceneReady: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async setupMorphixScene(windowTitleHint = OUTPUT_WINDOW_TITLE): Promise<void> {
    await this.connect();

    const scenes = await this.obs.call("GetSceneList");
    if (!scenes.scenes.some((s) => s.sceneName === MORPHIX_SCENE_NAME)) {
      await this.obs.call("CreateScene", { sceneName: MORPHIX_SCENE_NAME });
    }

    const sceneItems = await this.obs.call("GetSceneItemList", { sceneName: MORPHIX_SCENE_NAME });
    const existing = sceneItems.sceneItems.find((item) => item.sourceName === MORPHIX_INPUT_NAME);

    const windowSetting = windowTitleHint || OUTPUT_WINDOW_TITLE;

    if (!existing) {
      await this.obs.call("CreateInput", {
        sceneName: MORPHIX_SCENE_NAME,
        inputName: MORPHIX_INPUT_NAME,
        inputKind: "window_capture",
        inputSettings: {
          window: windowSetting,
          capture_cursor: false,
          method: 0,
        },
        sceneItemEnabled: true,
      });
    } else {
      await this.obs.call("SetInputSettings", {
        inputName: MORPHIX_INPUT_NAME,
        inputSettings: {
          window: windowSetting,
          capture_cursor: false,
        },
        overlay: true,
      });
    }

    const items = await this.obs.call("GetSceneItemList", { sceneName: MORPHIX_SCENE_NAME });
    const swapItem = items.sceneItems.find((item) => item.sourceName === MORPHIX_INPUT_NAME);
    if (swapItem) {
      const videoSettings = await this.obs.call("GetVideoSettings");
      const width = Number(videoSettings.baseWidth ?? 1280);
      const height = Number(videoSettings.baseHeight ?? 720);
      await this.obs.call("SetSceneItemTransform", {
        sceneName: MORPHIX_SCENE_NAME,
        sceneItemId: Number(swapItem.sceneItemId),
        sceneItemTransform: {
          positionX: 0,
          positionY: 0,
          alignment: 5,
          boundsType: "OBS_BOUNDS_SCALE_INNER",
          boundsAlignment: 0,
          boundsWidth: width,
          boundsHeight: height,
          scaleX: 1,
          scaleY: 1,
        },
      });
    }

    await this.obs.call("SetCurrentProgramScene", { sceneName: MORPHIX_SCENE_NAME });
  }

  async startVirtualCam(windowTitleHint = OUTPUT_WINDOW_TITLE): Promise<void> {
    await this.setupMorphixScene(windowTitleHint);
    const status = await this.obs.call("GetVirtualCamStatus");
    if (!status.outputActive) {
      await this.obs.call("StartVirtualCam");
    }
  }

  async stopVirtualCam(): Promise<void> {
    await this.connect();
    const status = await this.obs.call("GetVirtualCamStatus");
    if (status.outputActive) {
      await this.obs.call("StopVirtualCam");
    }
  }
}

export const obsVirtualCamService = new ObsVirtualCamService();
