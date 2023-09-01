import express from "express";
import { existsSync, mkdirSync, renameSync, writeFileSync } from "fs";
import "dotenv/config";
import { caproverApi } from "./caproverApi.js";
import { connect, id as get_id } from "@ulibs/db";

const api = caproverApi("https://captain.server.hadiahmadi.dev");

api.login({ password: process.env.CAPROVER_PASSWORD });

import {
  Container,
  Col,
  ButtonGroup,
  Row,
  Input,
  Card,
  CardBody,
  CardTitle,
  Icon,
  Modal,
  ModalBody,
  View,
  Button,
  Spinner,
} from "@ulibs/ui";

const { getModel } = connect({
  filename: "data/db.json",
});
const app = express();

function SiteItem(site) {
  return Col({ col: 12, colSm: 6, colMd: 4, h: "100" }, [
    Card({}, [
      CardBody([
        CardTitle({ tag: "strong" }, site.name),
        View({ d: "flex", flexDirection: "column" }, [
          site.domains.map((domain) => {
            return View(
              { mt: "xxs", tag: "a", href: "https://" + domain },
              domain
            );
          }),
        ]),
        View({ mt: "lg" }, [
          ButtonGroup([
            Button(
              {
                ms: "auto",
                onClick: `$modal.open("site-settings-${site.id}")`,
              },
              "Settings"
            ),
            Button(
              {
                color: "primary",
                href: "https://" + site.domains[0] + "/admin",
              },
              "Manage"
            ),
          ]),
        ]),
      ]),
    ]),
  ]);
}

function Layout(props, slot) {
  return View(
    {
      ...props,
      htmlHead: [
        '<link rel="stylesheet" href="https://unpkg.com/@ulibs/ui@next/dist/styles.css"/>',
        '<script src="https://unpkg.com/@ulibs/ui@next/dist/ulibs.js"></script>',
        `<script>

          function slugify(str, separator = '_') {
              let result = "";
              for (let i = 0; i < str.length; i++) {
              if (str[i] === " " || str[i] === "-" || str[i] === ":" || str[i] === "_") {
                  result += separator;
                  i++;
              }
              result += str[i]?.toLowerCase() ?? '';
              }
              return result;
          } 
      </script>`,
      ],
    },
    [slot]
  );
}

function SiteModal({ name, $data, actions, show_password }) {
  return Modal({ size: "xs", name }, [
    ModalBody(
      {
        style: "position: relative",
        $data,
        "u-init":
          '$watch("name", (value) => slug = override_slug || slugify(value, "-"))',
      },
      [
        View(
          {
            $if: "loading",
            style:
              "position: absolute; left: 0; right: 0; top: 0; bottom: 0; display: flex; align-items: center; justify-content: center; background-color: #50505050; z-index: 100",
          },
          [Spinner({ color: "primary", size: "lg" })]
        ),
        Row([
          Input({ label: "Name", name: "name" }),
          Input({
            label: "Slug",
            name: "slug",
            onInput: "override_slug = $event.target.value",
          }),

          (show_password &&
            Input({
              label: "Admin Password",
              name: "password",
              type: "password",
            })) ||
            "",
          Col({ d: "flex", w: 100, mt: "lg", justify: "end" }, [actions]),
        ]),
      ]
    ),
  ]);
}

function SiteAddModal() {
  return SiteModal({
    name: "add-site",
    show_password: true,
    $data: {
      loading: false,
      name: "",
      domains: [],
      slug: "",
      password: "",
      override_slug: "",
    },
    actions: [
      ButtonGroup([
        Button({ onClick: "$modal.close()" }, "Cancel"),
        Button(
          {
            color: "primary",
            onClick:
              'loading=true;$post("/create?name=" + name + "&slug=" + slug + "&password=" + password).then(res => location.reload())',
          },
          "Add"
        ),
      ]),
    ],
  });
}

function SiteUpdateModal(site) {
  return SiteModal({
    name: "site-settings-" + site.id,
    show_password: false,
    $data: {
      loading: false,
      name: site.name,
      password: "",
      domains: [],
      slug: site.domains[0].split(".")[0],
      override_slug: "",
    },
    actions: [
      ButtonGroup({ ms: "auto" }, [
        Button({ onClick: "$modal.close()" }, "Cancel"),
        Button(
          {
            onClick: `loading=true;$post("/remove?id=${site.id}").then(res => location.reload())`,
            color: "error",
          },
          "Remove"
        ),
        Button(
          {
            color: "primary",
            onClick: `loading=true;$post("/update?id=${site.id}&name=" + name + "&slug=" + slug).then(res => location.reload())`,
          },
          "Update"
        ),
      ]),
    ],
  });
}

app.get("/", async (req, res) => {
  const sites = await getModel("sites")
    .query({ perPage: 50 })
    .then((res) => res.data);

  console.log("request", req.method);
  const header = View(
    {
      bgColor: "base-200",
      style: "border-bottom: 1px solid var(--color-base-400)",
      py: "sm",
    },
    [
      Container(
        {
          d: "flex",
          align: "center",
          justify: "between",
          size: "xl",
          mx: "auto",
        },
        [
          View({ tag: "h2", py: "md" }, "UBuilder Site Manager"),
          Button(
            {
              size: "lg",
              color: "primary",
              onClick: '$modal.open("add-site")',
            },
            [Icon({ name: "plus" }), "Add Site"]
          ),
        ]
      ),
    ]
  );

  const content = Container({ mt: "xl", size: "xl", mx: "auto" }, [
    Row({ gutter: "lg" }, [sites.map((site) => SiteItem(site))]),
  ]);

  const page = Layout({}, [
    header,
    content,
    sites.map((site) => SiteUpdateModal(site)),
    SiteAddModal(),
  ]);

  res.send(page.toHtml());
});

app.use(express.json());

// SKIP adding Domain for localhost..

app.post("/create", async (req, res) => {
  const { name, slug, password } = req.query;

  let domain = slug + "." + req.headers.host;

  const [id] = await getModel("sites").insert({
    name,
    domains: [domain],
  });

  mkdirSync("data/" + id);
  mkdirSync("data/" + id + "/assets");

  const initialData = {
    "u-users": [
      {
        id: get_id(),
        name: "Admin",
        password: password + "_hashed",
        username: "admin",
      },
    ],
  };
  writeFileSync("data/" + id + "/db.json", JSON.stringify(initialData));

  if (!domain.includes("localhost")) {
    await api.attachNewCustomDomainToApp({
      appName: "cms",
      customDomain: domain,
    });
    setTimeout(async () => {
      await api.enableSslForCustomDomain({
        appName: "cms",
        customDomain: domain,
      });
      res.send({ message: "Success" });
    }, 1000);
  } else {
    res.send({ message: "success" });
  }
});

app.post("/update", async (req, res) => {
  const { name, slug, id } = req.query;
  const appl = await getModel("sites").get({ where: { id } });

  const domain = slug + "." + req.headers.host;

  await getModel("sites").update(id, {
    name,
    domains: [domain],
  });

  if (!domain.includes("localhost")) {
    await api.removeCustomDomain({
      appName: "cms",
      customDomain: appl.domains[0].split(".")[0],
    });

    await api.attachNewCustomDomainToApp({
      appName: "cms",
      customDomain: domain,
    });
    setTimeout(async () => {
      await api.enableSslForCustomDomain({
        appName: "cms",
        customDomain: domain,
      });
      res.send({ message: "Success" });
    }, 1000);
  } else {
    res.send({ message: "Success" });
  }
});

app.post("/remove", async (req, res) => {
  const { id } = req.query;
  const appl = await getModel("sites").get({ where: { id } });

  await getModel("sites").remove(id);

  if (!existsSync("data/backups")) {
    mkdirSync("data/backups");
  }
  renameSync("data/" + id, "data/backups/" + id + "-" + get_id());

  if (!appl.domains[0].includes("localhost")) {
    await api.removeCustomDomain({
      appName: "cms",
      customDomain: appl.domains[0],
    });
  }

  res.send({ message: "Success" });
});

app.listen(3000);
console.log("listening on http://localhost:" + 3000);
