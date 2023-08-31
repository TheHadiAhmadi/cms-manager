import express from "express";
import { caproverApi } from "./caproverApi.js";
const api = caproverApi("https://captain.server.hadiahmadi.dev");

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
} from "@ulibs/ui";

const app = express();

function SiteItem(site) {
  return Col({ col: 12, colSm: 6, colMd: 4, h: '100' }, [
    Card({ onClick: "site-settings-" + site.id }, [
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
          Button(
            { color: "primary", ms: "auto", href: "https://" + site.domains[0] + "/admin" },
            "Manage"
          ),
        ]),
      ]),
    ]),
  ]);
}

const sites = [
  {
    id: 1,
    name: "Personal Site",
    domains: ["hadiahmadi.dev", "hadi.cms.hadiahmadi.dev"],
  },
  {
    id: 1,
    name: "Another Site",
    domains: ["another.com", "another.cms.hadiahmadi.dev"],
  },
];

app.get("/", (req, res) => {
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
      sites.map(site => Modal({ size: "xs", name: "site-settings-" + site.id }, [
        ModalBody(
          {
            $data: { name: site.name, domains: [], slug: site.domains[0].split('.')[0], override_slug: "" },
            "u-init":
              '$watch("name", (value) => slug = override_slug || slugify(value))',
          },
          [
            Row([
              Input({ label: "Name", name: "name" }),
              Input({
                label: "Slug",
                name: "slug",
                onInput: "override_slug = $event.target.value",
              }),
              Col({ d: "flex", justify: "end" }, [
                ButtonGroup({ms: 'auto'}, [
                  Button({ onClick: "$modal.close()" }, "Cancel"),
                  Button(
                    {
                      color: "primary",
                      onClick: `$post("/create?id=${site.id}&name=" + name + "&slug=" + slug).then(res => location.reload())`,
                    },
                    "Update"
                  ),
                ]),
              ]),
            ]),
          ]
        ),
      ])),
      Modal({ size: "xs", name: "add-modal" }, [
        ModalBody(
          {
            $data: { name: "", domains: [], slug: "", override_slug: "" },
            "u-init":
              '$watch("name", (value) => slug = override_slug || slugify(value))',
          },
          [
            Row([
              Input({ label: "Name", name: "name" }),
              Input({
                label: "Slug",
                name: "slug",
                onInput: "override_slug = $event.target.value",
              }),
              Col({ d: "flex", justify: "end" }, [
                ButtonGroup([
                  Button({ onClick: "$modal.close()" }, "Cancel"),
                  Button(
                    {
                      color: "primary",
                      onClick: '$post("/create?name=" + name + "&slug=" + slug).then(res => location.reload())',
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

app.use(express.json())

app.post('/create', (req, res) => {
    const {name, slug} = req.query;

    sites.push({id: 'id_' + Math.random(), name, domains: [slug + '.cms.hadiahmadi.dev']})
    res.send({message: 'Success'})
})

app.post('/update', (req, res) => {
    const {name, slug, id} = req.query;
    sites = sites.map(site => {
        if(site.id === id) return {
            ...site, 
            name,
            domains: [slug + '.cms.hadiahmadi.dev']
        }
        return site
    })
    res.send({message: 'Success'})

})

app.listen(process.env.port || 3000);
console.log("listening on http://localhost:" + (process.env.port || 3000));
