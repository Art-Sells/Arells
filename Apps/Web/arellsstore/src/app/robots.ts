import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    return {
        rules : [
            {
            userAgent: "*",
            allow: "/",
            disallow: 
                [
                    "/bitcoin", 
                    "/bankaccount",
                    "/buy",
                    "/howitworks",
                    "/hpmtester",
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