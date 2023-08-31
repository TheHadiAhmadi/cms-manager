export const caproverApi = (base) => {
  const prefix = "/api/v2";
  let token;

  async function call(method, path, data) {
    console.log(`[${method}] "${path}" - ${data}`)
    const opts = {
      method,
      headers: {},
    };

    if (token) {
      opts.headers["x-captain-auth"] = token;
    }

    if (method === "POST") {
      opts.headers["Content-Type"] = "application/json";

      if (data) {
        opts.body = JSON.stringify(data);
      }
    }

    return fetch(base + prefix + path, opts)
      .then((res) => res.json())
      .then((res) => {
        console.log(`[${res.status}] ${res.description}`);

        return res.data;
      });
  }

  return {
    call,
    async login({ password }) {
      const res = await call("POST", "/login", { password });
      token = res.token;
    },
    getCaptainInfo() {
        return call('GET', '/user/system/info', {})
    },

    updateRootDomain({ rootDomain }) {
      return call("POST", "/user/system/changerootdomain", { rootDomain });
    },
    enableRootSsl({ emailAddress }) {
      return call("POST", "/user/system/enablessl", {
        emailAddress,
      });
    },
    forceSsl({ isEnabled }) {
      return call("POST", "/user/system/forcessl", { isEnabled });
    },
    getAllApps() {
      return call("GET", "/user/apps/appDefinitions", {});
    },

    fetchBuildLogs({ appName }) {
      return call("GET", "/user/apps/appData/" + appName, {});
    },
    uploadAppData({ appName, file, gitHash }) {
      // return call(
      //             'POST',
      //             '/user/apps/appData/' + appName + '?detached=1',
      //             { sourceFile: file, gitHash }
      //         )
    },
    uploadCaptainDefinitionContent({
      appName,
      captainDefinition,
      gitHash,
      detached,
    }) {
      return call(
        "POST",
        "/user/apps/appData/" + appName + (detached ? "?detached=1" : ""),
        {
          captainDefinitionContent: JSON.stringify(captainDefinition),
          gitHash,
        }
      );
    },
    updateConfigAndSave({ appName, appDefinition }) {
      const instanceCount = appDefinition.instanceCount;
      const envVars = appDefinition.envVars;
      const notExposeAsWebApp = appDefinition.notExposeAsWebApp;
      const forceSsl = appDefinition.forceSsl;
      const volumes = appDefinition.volumes;
      const ports = appDefinition.ports;
      const nodeId = appDefinition.nodeId;
      const appPushWebhook = appDefinition.appPushWebhook;
      const customNginxConfig = appDefinition.customNginxConfig;
      const preDeployFunction = appDefinition.preDeployFunction;

      return call("POST", "/user/apps/appDefinitions/update", {
        appName,
        instanceCount,
        notExposeAsWebApp,
        forceSsl,
        volumes,
        ports,
        customNginxConfig,
        appPushWebhook,
        nodeId,
        preDeployFunction,
        envVars,
      });
    },
    registerNewApp({ appName, hasPersistentData }) {
      return call("POST", "/user/apps/appDefinitions/register", {
        appName,
        hasPersistentData,
      });
    },
    deleteApp({ appName }) {
      return call("POST", "/user/apps/appDefinitions/delete", {
        appName,
      });
    },
    enableSslForBaseDomain({ appName }) {
      return call("POST", "/user/apps/appDefinitions/enablebasedomainssl", {
        appName,
      });
    },
    attachNewCustomDomainToApp({ appName, customDomain }) {
      return call("POST", "/user/apps/appDefinitions/customdomain", {
        appName,
        customDomain,
      });
    },
    enableSslForCustomDomain({ appName, customDomain }) {
      return call("POST", "/user/apps/appDefinitions/enablecustomdomainssl", {
        appName,
        customDomain,
      });
    },
    removeCustomDomain({ appName, customDomain }) {
      return call("POST", "/user/apps/appDefinitions/removecustomdomain", {
        appName,
        customDomain,
      });
    },
    getLoadBalancerInfo() {
      return call("GET", "/user/system/loadbalancerinfo", {});
    },
    getNetDataInfo() {
      return call("GET", "/user/system/netdata", {});
    },
    updateNetDataInfo({ netDataInfo }) {
      return call("POST", "/user/system/netdata", { netDataInfo });
    },
    changePass({ oldPassword, newPassword }) {
      return call("POST", "/user/changepassword", {
        oldPassword,
        newPassword,
      });
    },
    getVersionInfo() {
      return call("GET", "/user/system/versioninfo", {});
    },
    performUpdate({ latestVersion }) {
      return call("POST", "/user/system/versioninfo", {
        latestVersion,
      });
    },
    getNginxConfig() {
      return call("GET", "/user/system/nginxconfig", {});
    },
    setNginxConfig(customBase, customCaptain) {
      return call("POST", "/user/system/nginxconfig", {
        baseConfig: { customValue: customBase },
        captainConfig: { customValue: customCaptain },
      });
    },
    getUnusedImages({ mostRecentLimit }) {
      return call("GET", "/user/apps/appDefinitions/unusedImages", {
        mostRecentLimit: mostRecentLimit + "",
      });
    },
    deleteImages({ imageIds }) {
      return call("POST", "/user/apps/appDefinitions/deleteImages", {
        imageIds,
      });
    },
    getDockerRegistries() {
      return call("GET", "/user/registries", {});
    },
    enableSelfHostedDockerRegistry() {
      return call("POST", "/user/system/selfhostregistry/enableregistry", {});
    },
    disableSelfHostedDockerRegistry() {
      return call("POST", "/user/system/selfhostregistry/disableregistry", {});
    },
    addDockerRegistry({ dockerRegistry }) {
      return call("POST", "/user/registries/insert", {
        ...dockerRegistry,
      });
    },
    updateDockerRegistry({ dockerRegistry }) {
      return call("POST", "/user/registries/update", {
        ...dockerRegistry,
      });
    },
    deleteDockerRegistry({ registryId }) {
      return call("POST", "/user/registries/delete", {
        registryId,
      });
    },
    setDefaultPushDockerRegistry({ registryId }) {
      return call("POST", "/user/registries/setpush", {
        registryId,
      });
    },
    getAllNodes() {
      return call("GET", "/user/system/nodes", {});
    },
    addDockerNode({
      nodeType,
      privateKey,
      remoteNodeIpAddress,
      captainIpAddress,
    }) {
      return call("POST", "/user/system/nodes", {
        nodeType,
        privateKey,
        remoteNodeIpAddress,
        captainIpAddress,
      });
    },
  };
};
