#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface, TransferChecked,transfer_checked};
declare_id!("coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF");

const ANCHOR_DISCRIMINATOR: usize = 8;

#[program]
pub mod vesting {
    use super::*;

    pub fn create_vesting_account(
        ctx: Context<CreateVestingAccount>,
        company_name: String,
    ) -> Result<()> {
        let acc = &mut ctx.accounts.vesting_account;
        acc.owner = ctx.accounts.owner.key();
        acc.mint = ctx.accounts.mint.key();
        acc.treasury_token_account = ctx.accounts.treasury_token_account.key();
        acc.company_name = company_name;
        acc.treasury_bump = ctx.bumps.treasury_token_account;
        acc.bump = ctx.bumps.vesting_account;

        Ok(())
    }

    pub fn create_employee_account(
        ctx: Context<CreateEmployeeAccount>,
        start_time: i64,
        end_time: i64,
        total_amount: u64,
        cliff_time: i64,
    ) -> Result<()> {
        *ctx.accounts.employee_account = EmployeeData {
            beneficiary: ctx.accounts.beneficiary.key(),
            start_time,
            end_time,
            total_amount,
            total_withdrawn: 0,
            cliff_time,
            vesting_account: ctx.accounts.vesting_account.key(),
            bump: ctx.bumps.employee_account,
        };

        Ok(())
    }

    pub fn claim_tokens(ctx: Context<ClaimTokens>, _company_name: String) -> Result<()> {
        let employee_acc = &mut ctx.accounts.employee_account;
        // check time limit
        let now = Clock::get()?.unix_timestamp;
        if now < employee_acc.cliff_time {
            return Err(ErrorCode::ClaimNotAvailableYet.into());
        }

        // calculate how much left to be claimed
        let time_since_start = now.saturating_sub(employee_acc.start_time);
        let total_vesting_time = employee_acc
            .end_time
            .saturating_sub(employee_acc.start_time);
        let vested_amount = if now >= employee_acc.end_time {
            employee_acc.total_amount
        } else {
            (employee_acc.total_amount * time_since_start as u64) / total_vesting_time as u64
        };
        let claimable = vested_amount.saturating_sub(employee_acc.total_withdrawn);
        if claimable == 0 {
            return Err(ErrorCode::NothingToClaim.into());
        }
        // make the transfer
        let transfer_option = TransferChecked {
            from: ctx.accounts.treasury_token_account.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.employee_token_account.to_account_info(),
            authority: ctx.accounts.treasury_token_account.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let signer_seeds: &[&[&[u8]]] = &[
            &[
                b"vesting_treasury",
                ctx.accounts.vesting_account.company_name.as_bytes(),
                &[ctx.accounts.vesting_account.treasury_bump],
            ],
        ];
        let cpi_context = CpiContext::new_with_signer(cpi_program, transfer_option, signer_seeds);
        transfer_checked(
            cpi_context,
            claimable as u64,
            ctx.accounts.mint.decimals,
        )?;
        // update the withdrawal amount
        employee_acc.total_withdrawn += claimable;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(company_name:String)]
pub struct CreateVestingAccount<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
    payer = owner,
    space = ANCHOR_DISCRIMINATOR + VestingData::INIT_SPACE,
    seeds = [company_name.as_bytes()],
    bump,
    )]
    pub vesting_account: Account<'info, VestingData>,

    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
    init,
    token::mint = mint,
    token::authority = treasury_token_account,
    payer = owner,
    seeds = [b"vesting_treasury", company_name.as_bytes()],
    bump,
    )]
    pub treasury_token_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateEmployeeAccount<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    pub beneficiary: SystemAccount<'info>,
    #[account(has_one = owner)]
    pub vesting_account: Account<'info, VestingData>,
    #[account(
        init,
        space = 8 + EmployeeData::INIT_SPACE,
        payer = owner,
        seeds = [b"employee_vesting", beneficiary.key().as_ref(), vesting_account.key().as_ref()],
        bump
    )]
    pub employee_account: Account<'info, EmployeeData>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(company_name: String)]
pub struct ClaimTokens<'info> {
    #[account(mut)]
    pub beneficiary: Signer<'info>,

    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub treasury_token_account: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,

    #[account(
        mut,
        seeds = [company_name.as_ref()],
        bump = vesting_account.bump,
        has_one = treasury_token_account,
        has_one = mint
    )]
    pub vesting_account: Account<'info, VestingData>,

    #[account(
        mut,
        seeds = [b"employee_vesting", beneficiary.key().as_ref(), vesting_account.key().as_ref()],
        bump = employee_account.bump,
        has_one = beneficiary,
        has_one = vesting_account
    )]
    pub employee_account: Account<'info, EmployeeData>,

    #[account(
        init_if_needed,  // because claim may be called multiple times
        payer = beneficiary,
        associated_token::mint = mint,
        associated_token::authority = beneficiary,
        associated_token::token_program = token_program
    )]
    pub employee_token_account: InterfaceAccount<'info, TokenAccount>,
}

#[account]
#[derive(InitSpace)]
pub struct VestingData {
    pub owner: Pubkey,
    pub mint: Pubkey,
    pub treasury_token_account: Pubkey,
    #[max_len(50)]
    pub company_name: String,
    pub treasury_bump: u8,
    pub bump: u8,
}
#[account]
#[derive(InitSpace, Debug)]
pub struct EmployeeData {
    pub beneficiary: Pubkey,
    pub start_time: i64,
    pub end_time: i64,
    pub total_amount: u64,
    pub total_withdrawn: u64,
    pub cliff_time: i64,
    pub vesting_account: Pubkey,
    pub bump: u8,
}
#[error_code]
pub enum ErrorCode {
    #[msg("Claiming is not available yet.")]
    ClaimNotAvailableYet,
    #[msg("There is nothing to claim.")]
    NothingToClaim,
}
