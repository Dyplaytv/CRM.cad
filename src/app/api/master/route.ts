import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/authSession";
import {
  createCompany,
  createManager,
  deleteCompany,
  deleteManager,
  getMasterOverviewStats,
  listCompanies,
  listManagers,
  toggleCompanyActive,
  updateCompany,
  updateManager,
} from "@/lib/crmStore";

export async function GET(req: NextRequest) {
  const user = getSessionUser(req);
  if (!user || user.mode !== "super_master") {
    return NextResponse.json({ ok: false, error: "Acesso restrito ao Master." }, { status: 403 });
  }

  return NextResponse.json({
    ok: true,
    companies: listCompanies(),
    managers: listManagers(),
    stats: getMasterOverviewStats(),
  });
}

export async function POST(req: NextRequest) {
  const user = getSessionUser(req);
  if (!user || user.mode !== "super_master") {
    return NextResponse.json({ ok: false, error: "Acesso restrito ao Master." }, { status: 403 });
  }

  try {
    const body = (await req.json()) as {
      action?: "createCompany" | "createManager" | "toggleCompany";
      name?: string;
      document?: string;
      companyId?: string;
      username?: string;
      password?: string;
    };

    if (body.action === "createCompany") {
      const result = createCompany({
        name: body.name || "",
        document: body.document,
      });
      if (!result.ok) {
        return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({
        ok: true,
        company: result.company,
        stats: getMasterOverviewStats(),
      });
    }

    if (body.action === "createManager") {
      const result = createManager({
        companyId: body.companyId || "",
        name: body.name || "",
        username: body.username || "",
        password: body.password || "",
      });
      if (!result.ok) {
        return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({
        ok: true,
        manager: result.manager,
        stats: getMasterOverviewStats(),
      });
    }

    if (body.action === "toggleCompany") {
      const updated = toggleCompanyActive(body.companyId || "");
      if (!updated) {
        return NextResponse.json({ ok: false, error: "Empresa não encontrada." }, { status: 404 });
      }
      return NextResponse.json({
        ok: true,
        company: updated,
        stats: getMasterOverviewStats(),
      });
    }

    return NextResponse.json({ ok: false, error: "Ação inválida." }, { status: 400 });
  } catch {
    return NextResponse.json({ ok: false, error: "Erro ao processar solicitação." }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = getSessionUser(req);
  if (!user || user.mode !== "super_master") {
    return NextResponse.json({ ok: false, error: "Acesso restrito ao Master." }, { status: 403 });
  }

  const type = req.nextUrl.searchParams.get("type");
  const id = req.nextUrl.searchParams.get("id") || "";
  if (!id || (type !== "company" && type !== "manager")) {
    return NextResponse.json({ ok: false, error: "Parâmetros inválidos." }, { status: 400 });
  }

  const ok = type === "company" ? deleteCompany(id) : deleteManager(id);
  if (!ok) {
    return NextResponse.json({ ok: false, error: "Registro não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, stats: getMasterOverviewStats() });
}

export async function PATCH(req: NextRequest) {
  const user = getSessionUser(req);
  if (!user || user.mode !== "super_master") {
    return NextResponse.json({ ok: false, error: "Acesso restrito ao Master." }, { status: 403 });
  }

  try {
    const body = (await req.json()) as {
      action?: "updateCompany" | "updateManager";
      id?: string;
      companyId?: string;
      name?: string;
      document?: string;
      username?: string;
      password?: string;
    };

    if (body.action === "updateCompany") {
      const result = updateCompany(body.id || "", {
        name: body.name || "",
        document: body.document,
      });
      if (!result.ok) {
        return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({
        ok: true,
        company: result.company,
        stats: getMasterOverviewStats(),
      });
    }

    if (body.action === "updateManager") {
      const result = updateManager(body.id || "", {
        companyId: body.companyId || "",
        name: body.name || "",
        username: body.username || "",
        password: body.password || undefined,
      });
      if (!result.ok) {
        return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({
        ok: true,
        manager: result.manager,
        stats: getMasterOverviewStats(),
      });
    }

    return NextResponse.json({ ok: false, error: "Ação inválida." }, { status: 400 });
  } catch {
    return NextResponse.json({ ok: false, error: "Erro ao atualizar registro." }, { status: 400 });
  }
}
