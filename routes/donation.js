import express from "express";
import Stripe from "stripe";
import { churchInfo } from "../config.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const YOUR_DOMAIN = "http://church-nbm.com";

router.get("/donate", (req, res) => {
    res.render("donate", {
        stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        user: req.session?.user || null,
        data: churchInfo,
    });
});

router.get("/success", (req, res) => {
    res.render("donate_success", {
        user: req.session?.user || null,
        data: churchInfo,
    });
});

router.get("/cancel", (req, res) => {
    res.render("donate_cancel", {
        user: req.session?.user || null,
        data: churchInfo,
    });
});

router.post("/stripe", async (req, res) => {
    const { amount } = req.body;

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: { name: "Donation to Church" },
                        unit_amount: amount * 100,
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${YOUR_DOMAIN}/donate/success`,
            cancel_url: `${YOUR_DOMAIN}/donate/cancel`,
        });

        res.redirect(303, session.url);
    } catch (error) {
        console.error("Stripe Checkout Error:", error.message);
        res.status(500).send("خطایی در پرداخت رخ داد.");
    }
});

export default router;
