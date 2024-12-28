use anchor_lang::prelude::*;

declare_id!("DEm6215DnsbbS4EGKzApXRVBabQTZHGvQ6gP25iZWCSq");

#[program]
pub mod crudapp {
    use super::*;

    pub fn create_journal_entry(
        ctx: Context<CreateJournalEntry>,
        title: String,
        message: String,
    ) -> Result<()> {
        let journal_entry = &mut ctx.accounts.journal_entry;
        journal_entry.owner = ctx.accounts.owner.key();
        journal_entry.title = title;
        journal_entry.message = message;
        Ok(())
    }
    pub fn update_journal_entry(
        ctx: Context<UpdateJournalEntry>,
        _title: String,
        message: String,
    ) -> Result<()> {
        let journal_entry = &mut ctx.accounts.journal_entry;
        journal_entry.message = message;
        Ok(())
    }

    pub fn delete_journal_entry(
        _ctx: Context<DeleteJournalEntry>,
        _title: String,
    ) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct CreateJournalEntry<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
    init,
    payer = owner,
    space = 8 + JournalEntry::INIT_SPACE,
    seeds = [title.as_ref(), owner.key().as_ref()],
    bump,
  )]
    pub journal_entry: Account<'info, JournalEntry>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct UpdateJournalEntry<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
    mut,
    realloc = 8 + JournalEntry::INIT_SPACE,
    realloc::payer = owner,
    realloc::zero = true,
    seeds = [title.as_ref(), owner.key().as_ref()],
    bump,
    )]
    pub journal_entry: Account<'info, JournalEntry>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct DeleteJournalEntry<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
    mut,
    seeds = [title.as_ref(), owner.key().as_ref()],
    bump,
    close = owner
    )]
    pub journal_entry: Account<'info, JournalEntry>,
}
#[account]
#[derive(InitSpace)]
pub struct JournalEntry {
    pub owner: Pubkey,

    #[max_len(32)]
    pub title: String,

    #[max_len(200)]
    pub message: String,
}
