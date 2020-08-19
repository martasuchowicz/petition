/* eslint-disable no-unused-vars */
const express = require("express");
const app = express();
const handlebars = require("express-handlebars");
const cookieSession = require("cookie-session");
const csurf = require("csurf");

const {
    addSigner,
    insertProfileData,
    sigCheck,
    insertRegData,
    getPassword,
    getAllSigners,
    getSignersByCity,
    dataToEdit,
    updateProfileWithoutPw,
    updateProfileWithPw,
} = require("./db.js");

const { hash, compare } = require("./bc.js");

// cookie session setup
app.use(
    cookieSession({
        secret: `I'm always angry.`,
        maxAge: 1000 * 60 * 60 * 24 * 14,
    })
);

//to set up express handlebars

app.engine("handlebars", handlebars());
app.set("view engine", "handlebars");

// setup to see user submitted get request

app.use(
    express.urlencoded({
        extended: false,
    })
);

// CSRF protection middleware

app.use(csurf());

// to set up the csrfToken / handle vunerabilities

app.use(function (req, res, next) {
    res.setHeader("x-frame-options", "deny");
    res.locals.csrfToken = req.csrfToken();
    next();
});

// css connect

app.use(express.static("./public"));

// 1. Routes

// ------ Registration + login routes -----

app.get("/", (req, res) => {
    res.redirect("/registration");
});
// GET request registration
app.get("/registration", (req, res) => {
    res.render("registration");
});

// POST request registration

app.post("/registration", (req, res) => {
    hash(req.body.password)
        .then((hashedPw) => {
            insertRegData(
                req.body.first,
                req.body.last,
                req.body.email,
                hashedPw
            )
                .then((result) => {
                    req.session.id = result.rows[0].id;
                    if (req.session.id) {
                        res.redirect("/profile");
                    } else {
                        res.render("registration", {
                            error: true,
                        });
                    }
                })
                // eslint-disable-next-line no-unused-vars
                .catch((err) => {
                    res.render("registration", { error: true });
                });
        })
        .catch((err) => {
            res.sendStatus(500);
        });
});

// GET request login

app.get("/login", (req, res) => {
    res.render("login", {});
});

// POST request login

app.post("/login", (req, res) => {
    let userEmail = req.body.email;
    let userPassword = req.body.password;

    getPassword(userEmail)
        .then((result) => {
            if (result.rows.length === 0) {
                res.render("login", {
                    error: true,
                });
            }
            const hashedUserPasswordFromDb = result.rows[0].password;
            compare(userPassword, hashedUserPasswordFromDb)
                .then((match) => {
                    if (match) {
                        let userId = result.rows[0].id;
                        req.session.id = userId;
                        sigCheck(req.session.id)
                            .then((result) => {
                                if (result.rowCount == 0) {
                                    res.redirect("/petition");
                                } else {
                                    res.redirect("/thanks");
                                }
                            })
                            .catch((err) => {
                                console.log(
                                    "error in POST / login SigCheck: ",
                                    err
                                );
                            });
                    } else {
                        res.render("login", { error: true });
                    }
                })
                .catch((err) => {
                    console.log("error in POST / login compare: ", err);
                    res.sendStatus(500);
                });
        })
        .catch((err) => {
            console.log("error in POST/login: ", err);
        });
});

// GET request for Profile

app.get("/profile", (req, res) => {
    res.render("profile");
});

// POST request for profile

app.post("/profile", (req, res) => {
    if (req.session.id) {
        if (
            !req.body.url.startsWith("https://") ||
            !req.body.url.startsWith("http://")
        ) {
            console.log("URL has to be changed");
            req.body.url = `https://${req.body.url}`;
        }
        insertProfileData(
            req.body.age,
            req.body.city,
            req.body.url,
            req.body.id
        )
            .then((result) => {
                console.log("result: ", result);
                res.redirect("/petition");
            })
            .catch((err) => {
                console.log("error in POST/profile: ", err);
            });
    }
});

// GET route to user profile edit

app.get("/edit", (req, res) => {
    if (req.session.id) {
        dataToEdit(req.session.id)
            .then((result) => {
                res.render("edit", { supporters: result.rows });
            })
            .catch((err) => {
                console.log("error in GET/profile/edit: ", err);
            });
    }
});

// POST route to user profile edit

app.post("/edit", (req, res) => {
    if (req.session.id) {
        if (req.body.password === "") {
            console.log(req.body);

            updateProfileWithoutPw(
                req.body.first,
                req.body.last,
                req.body.email,
                req.session.id
            )
                .then((result) => {
                    console.log("You are updating data without your password");
                    console.log("Result updated without password: ", result);
                    res.redirect("/thanks");
                })
                .catch((err) => {
                    console.log(
                        "error in GET/profile/edit without password: ",
                        err
                    );
                });
        } else {
            hash(req.body.password).then((hashedPw) => {
                updateProfileWithPw(
                    req.body.first,
                    req.body.last,
                    req.body.email,
                    hashedPw,
                    req.session.id
                )
                    .then((result) => {
                        console.log("You are updating data wit your password");
                        console.log("Result updated with password: ", result);
                        res.redirect("/thanks");
                    })
                    .catch((err) => {
                        console.log(
                            "error in GET/profile/edit with password: ",
                            err
                        );
                    });
            });
        }
    }
});

// GET /petition

app.get("/petition", (req, res) => {
    if (req.session.id) {
        sigCheck(req.session.id)
            .then((result) => {
                if (result.rowCount === 0) {
                    res.render("petition");
                } else {
                    res.redirect("/thanks");
                }
            })
            .catch((err) => {
                console.log("error in GET/petition sigCheck: ", err);
            });
    } else {
        res.redirect("/registration");
    }
});

// POST /petition

app.post("/petition", (req, res) => {
    if (req.body.signature.length > 0) {
        addSigner(req.session.id, req.body.signature)
            .then((result) => {
                res.redirect("/thanks");
                console.log("result: ", result); // comment
            })
            .catch((error) => {
                res.render("petition", { error: true });
                console.log("error: ", error);
            });
    } else {
        res.render("petition", { error: true });
    }
});

// GET /thanks

app.get("/thanks", (req, res) => {
    if (req.session.id) {
        sigCheck(req.session.id)
            .then((result) => {
                res.render("thanks", {
                    signature: result.rows[0].signature,
                });
            })
            .catch((err) => {
                console.log("error in GET / thanks sigCheck: ", err);
            });
    } else {
        res.redirect("/registration");
    }
});

// GET /signers

app.get("/signers", (req, res) => {
    if (req.session.id) {
        sigCheck(req.session.id).then((result) => {
            if (result.rowCount === 0) {
                res.redirect("/petition");
            } else {
                getAllSigners()
                    .then((result) => {
                        console.log(result.rows);
                        res.render("signers", { supporters: result.rows });
                    })
                    .catch((err) => {
                        console.log("error in GET/signers: ", err);
                    });
            }
        });
    } else {
        res.redirect("/petition");
    }
});

// GET /city

app.get("/city", (req, res) => {
    getSignersByCity(req.params.city)
        .then((result) => {
            console.log("result for signers/city: ", result);
            res.render("city", {
                supporters: result.row,
                city: req.params.city,
            });
            console.log("req.params: ", req.params);
        })
        .catch((err) => {
            console.log("error in GET/signers/city ", err);
        });
});

app.listen(process.env.PORT || 8080, () => console.log("server listening"));
