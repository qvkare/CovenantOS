#![doc = "Odra CLI entrypoint for CovenantOS contracts."]
use odra_cli::OdraCli;

fn main() {
    OdraCli::new().exec();
}
