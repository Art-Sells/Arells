import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    return {
        rules : [
            {
            userAgent: "*",
            allow: "/",
            disallow: 
                [
                    "/account", 
                    "/bankaccount",
                    "/buy",
                    "/export",
                    "/howitworks",
                    "/hpmtester",
                    "/import",
                    "/privacy-policy",
                    "/sell",
                    "/transactions",
                    "/wallettester",
                    "/withdraw"
                ]
            }
        ],
        sitemap: `https://arells.com/sitemap.xml`
    }

}