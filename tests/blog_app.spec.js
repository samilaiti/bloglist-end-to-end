const { test, describe, expect, beforeEach } = require('@playwright/test')
const { loginWith, createBlog } = require('./helper')

describe('Blog app', () => {
  beforeEach(async ({ page, request }) => {
    await request.post('/api/testing/reset')
    await request.post('/api/users', {
      data: {
        name: 'Sami Laitinen',
        username: 'samilai',
        password: 'salainen'
      }
    })

    await page.goto('/')
    // await loginWith(page, 'samilai', 'salainen')
  })

  test('Login form is shown', async ({ page }) => {
    const locator = await page.getByText('log in to application')
    await expect(locator).toBeVisible()
    await expect(page.getByText('log in to application')).toBeVisible()
  })

  describe('Login', () => {
    test('succeeds with correct credentials', async ({ page }) => {
      await loginWith(page, 'samilai', 'salainen')
      await expect(page.getByText('Sami Laitinen logged in')).toBeVisible()
    })

    test('login fails with wrong password', async ({ page }) => {
      await loginWith(page, 'samilai', 'wrong')

      const errorDiv = await page.locator('.error')
      await expect(errorDiv).toContainText('wrong credentials')
      await expect(errorDiv).toHaveCSS('border-style', 'solid')
      await expect(errorDiv).toHaveCSS('color', 'rgb(255, 0, 0)')

      await expect(page.getByText('Sami Laitinen logged in')).not.toBeVisible()
    })
  })

  describe('When logged in', () => {
    beforeEach(async ({ page }) => {
      await page.goto('/')
      await loginWith(page, 'samilai', 'salainen')
    })
    test('a new blog can be created', async ({ page }) => {
      await createBlog(page, 'Playwright test blog', 'Osku Olematon', 'www.playwright-test.fi')
      await expect(page.getByTestId('simpleblog').getByText('Playwright test blog')).toBeVisible()
    })
  })
  describe('a blog exists', () => {
    beforeEach(async ({ page }) => {
      await page.goto('/')
      await loginWith(page, 'samilai', 'salainen')
    })
    test('likes can be added', async ({ page }) => {
      await createBlog(page, 'Another Playwright test blog', 'Osku Olematon', 'www.playwright-test.fi')
      await page.getByTestId('simpleblog').getByRole('button', { name: 'view' }).click()
      await page.getByRole('button', { name: 'like' }).click()
      await expect(page.getByTestId('fullblog').getByText('1')).toBeVisible()
    })
    test('blog can be deleted', async ({ page }) => {
      page.on('dialog', async dialog => {
        if (dialog.message().includes('Remove blog')) {
          await dialog.accept()
        } else {
          await dialog.dismiss()
        }
      })

      await createBlog(page, 'Third Playwright test blog', 'Osku Olematon', 'www.playwright-test.fi')
      await page.getByTestId('simpleblog').getByRole('button', { name: 'view' }).click()
      await page.getByRole('button', { name: 'like' }).click()
      // await page.getByTestId('simpleblog').getByRole('button', { name: 'view' }).click()
      await page.getByRole('button', { name: 'remove' }).click()
      await expect(page.getByTestId('fullblog').getByText('Third Playwright test blog')).not.toBeVisible()
    })

  })
  describe('many blogs exist', () => {
    beforeEach(async ({ page }) => {
      await page.goto('/')
      await loginWith(page, 'samilai', 'salainen')
    })
    test('blogs are sorted correctly', async ({ page }) => {
      await createBlog(page, 'First blog', 'Osku Olematon', 'www.playwright-test.fi')
      await createBlog(page, 'Second blog', 'Osku Olematon', 'www.playwright-test.fi')
      await createBlog(page, 'Third blog', 'Osku Olematon', 'www.playwright-test.fi')
      await page.getByText('First blog').getByRole('button', { name: 'view' }).click()
      await page.getByText('First blog').getByRole('button', { name: 'like' }).click()
      await page.getByText('First blog').getByRole('button', { name: 'like' }).click()
      await page.getByText('First blog').getByRole('button', { name: 'like' }).click()
      await page.getByText('Second blog').getByRole('button', { name: 'view' }).click()
      await page.getByText('Second blog').getByRole('button', { name: 'like' }).click()
      await page.getByText('Second blog').getByRole('button', { name: 'like' }).click()
      await page.getByText('Third blog').getByRole('button', { name: 'view' }).click()
      await page.getByText('Third blog').getByRole('button', { name: 'like' }).click()
      // await page.getByRole('button', { name: 'hide' }).click()
      // await expect(page.getByTestId('fullblog').getByText('playwright')).toBeVisible()
      const likes = page.getByTestId('fullblog')
      const likesCount = await likes.count()
      console.log('likes', likesCount)
      for (var i = 0; i < likesCount; i++) {
        const element = await likes.nth(i)
        if (i == 0) {
          await expect(element.getByText('0')).toBeVisible()
        } else if (i == 1) {
          await expect(element.getByText('1')).toBeVisible()
        } else {
          await expect(element.getByText('2')).toBeVisible()
        }
      }

    })
  })
})
