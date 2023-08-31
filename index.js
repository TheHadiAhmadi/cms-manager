import express from "express";
import 'dotenv/config'
import { caproverApi } from "./caproverApi.js";
import { connect } from "@ulibs/db";

const api = caproverApi("https://captain.server.hadiahmadi.dev");

api.login({password: process.env.CAPROVER_PASSWORD})

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
    Card({ }, [
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
        View({ my: "sm" }, [
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

// const sites = [
//   {
//     id: 1,
//     name: "Personal Site",
//     domains: ["hadiahmadi.dev", "hadi.cms.hadiahmadi.dev"],
//   },
//   {
//     id: 1,
//     name: "Another Site",
//     domains: ["another.com", "another.cms.hadiahmadi.dev"],
//   },
// ];

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
              onClick: '$modal.open("add-modal")',
            },
            [Icon({ name: "plus" }), "Add Site"]
          ),
        ]
      ),
    ]
  );

  const page = View(
    {
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
    [
      header,
      Container({ mt: "xl", size: "xl", mx: "auto" }, [
        Row({ gutter: "lg" }, [sites.map((site) => SiteItem(site))]),
      ]),
      View([]),
      sites.map((site) =>
        Modal({ size: "xs", name: "site-settings-" + site.id }, [
          
          ModalBody(
            {
              style:"position: relative", 
              $data: {
                loading: false,
                name: site.name,
                domains: [],
                slug: site.domains[0].split(".")[0],
                override_slug: "",
              },
              "u-init":
                '$watch("name", (value) => slug = override_slug || slugify(value))',
            },
            [
              View({$if: 'loading', style:"position: absolute; left: 0; right: 0; top: 0; bottom: 0; display: flex; align-items: center; justify-content: center; background-color: #50505050; z-index: 100"}, [
                Spinner({color: 'primary', size: 'lg'})
              ]),
              Row([
                Input({ label: "Name", name: "name" }),
                Input({
                  label: "Slug",
                  name: "slug",
                  onInput: "override_slug = $event.target.value",
                }),
                Col({ d: "flex", mt: "lg", justify: "end" }, [
                  ButtonGroup({ ms: "auto" }, [
                    Button({ onClick: "$modal.close()" }, "Cancel"),
                    Button({onClick: `loading=true;$post("/remove?id=${site.id}").then(res => location.reload())`, color: 'danger'}, "Remove"),
                    Button(
                      {
                        color: "primary",
                        onClick: `loading=true;$post("/update?id=${site.id}&name=" + name + "&slug=" + slug).then(res => location.reload())`,
                      },
                      "Update"
                    ),
                  ]),
                ]),
              ]),
            ]
          ),
        ])
      ),
      Modal({ size: "xs", name: "add-modal" }, [
        
        ModalBody(
          {
            style: "position:relative",
            $data: { loading: false, name: "", domains: [], slug: "", override_slug: "" },
            "u-init":
              '$watch("name", (value) => slug = override_slug || slugify(value))',
          },
          [
            View({$if: 'loading', style:"position: absolute; left: 0; right: 0; top: 0; bottom: 0; display: flex; align-items: center; justify-content: center; background-color: #50505050; z-index: 100"}, [
              Spinner({color: 'primary', size: 'lg'})
            ]),
            Row([
              Input({ label: "Name", name: "name" }),
              Input({
                label: "Slug",
                name: "slug",
                onInput: "override_slug = $event.target.value",
              }),
              Col({ d: "flex", mt: "lg", justify: "end" }, [
                ButtonGroup([
                  Button({ onClick: "$modal.close()" }, "Cancel"),
                  Button(
                    {
                      color: "primary",
                      onClick:
                        'loading=true;$post("/create?name=" + name + "&slug=" + slug).then(res => location.reload())',
                    },
                    "Add"
                  ),
                ]),
              ]),
            ]),
          ]
        ),
      ]),
    ]
  );

  res.send(page.toHtml());
});

app.use(express.json());

app.post("/create", async (req, res) => {
  const { name, slug } = req.query;

  const domain = slug + ".cms.hadiahmadi.dev"
  
  await getModel("sites").insert({
    name,
    domains: [domain],
  });

  await api.attachNewCustomDomainToApp({appName: 'cms', customDomain: slug + ".cms.hadiahmadi.dev"})
  setTimeout(async () => {
    await api.enableSslForCustomDomain({appName: 'cms', customDomain: domain})
    res.send({ message: "Success" });
  }, 1000) 
});

app.post("/update", async (req, res) => {
  const { name, slug, id } = req.query;
  const appl = await getModel('sites').get({where: {id}})
  await getModel("sites").update(id, {
    name,
    domains: [slug + ".cms.hadiahmadi.dev"],
  });

  await api.removeCustomDomain({appName: 'cms', customDomain: appl.domains[0].split('.')[0]})
  
  await api.attachNewCustomDomainToApp({appName: 'cms', customDomain: slug + ".cms.hadiahmadi.dev"})
  setTimeout(async () => {
    await api.enableSslForCustomDomain({appName: 'cms', customDomain: domain})
    res.send({ message: "Success" });
  }, 1000) 
  
  res.send({ message: "Success" });
});


app.post('/remove', async  (req, res) => {
  const { id } = req.query;
  const appl = await getModel('sites').get({where: {id}})
  console.log({appl} ,appl)

  await getModel("sites").remove(id);

  await api.removeCustomDomain({appName: 'cms', customDomain: appl.domains[0]})
    
  res.send({ message: "Success" });

})

app.listen(process.env.port || 3000);
console.log("listening on http://localhost:" + (process.env.port || 3000));
